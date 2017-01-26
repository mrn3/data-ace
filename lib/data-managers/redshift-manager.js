"use babel"

import pg from 'pg'
import DataManager from './data-manager'

export default class RedshiftManager extends DataManager {
  constructor(url) {
    super(url)

    this.config.user = encodeURIComponent(this.config.user)
    this.config.password = encodeURIComponent(this.config.password)
  }

  destroy() {
    pg.end()
  }

  execute(database, query, onQueryToken) {
    return new Promise((resolve, reject) => {
      let url = database !== '' ? this.getUrlWithDb(database) : this.getUrl()
      pg.connect(url, (err, client, done) => {
        if (err) {
          // call `done()` to release the client back to the pool
          done()
          reject(this.buildErrorMessage(err))
        }
        else {
          let pgQuery = client.query({text: query, rowMode: 'array'}, (err, results) => {
            if (err) {
              done()
              reject(this.buildErrorMessage(err))
            }
            else {
              done()
              resolve(this.translateResults(results))
            }
          })
          if (onQueryToken) {
            // give back some data so they can tell us to cancel the query if needed
            onQueryToken({ client: client, query: pgQuery })
          }
        }
      })
    })
  }

  buildErrorMessage(err) {
    return err.toString() + '\n' + (err.where || '')
  }

  cancelExecution(queryToken) {
    pg.cancel(queryToken.client.connectionParameters, queryToken.client, queryToken.query)
  }

  // conver the results into what we expect so the UI doens't have to handle all different result types
  translateResults(result) {
    let translatedResults = []
    //for (let i = 0; i < results.length; i++) {
      //let result = results[i]
      if (result.command != 'SELECT') {
        translatedResults.push({ message: this.buildMessage(result), command: result.command, fields: result.fields, rowCount: result.rowCount, rows: result.rows })
      }
      else {
        translatedResults.push({ command: result.command, fields: result.fields, rowCount: result.rowCount, rows: result.rows })
      }
    //}
    return translatedResults
  }

  buildMessage(results) {
    let str = ''
    switch (results.command) {
      case 'UPDATE': str += results.rowCount + ' rows updated.'
        break
      case 'DELETE': str += results.rowCount + ' rows deleted.'
        break
      case 'INSERT': str += results.rowCount + ' rows inserted.'
        break
      case 'CREATE': str += 'Create successful.'
        break
      default: str += JSON.stringify(results)
    }
    return str
  }

  checkSuperUser() {
    if (this.config.superUser === undefined) {
      return this.execute(this.defaultDatabase, 'select usesuper from pg_user where usename = \'' + this.config.user + '\'')
      .then(results => {
        if(results[0].rows.length > 0)
          this.config.superUser = results[0].rows[0][0]
        else
          this.config.superUser = false
      })
      .catch(err => {
        this.config.superUser = false
      })
    }
    else {
      return Promise.resolve()
    }
  }

  getDatabaseNames() {
    if (!this.dbNames) {
      return this.checkSuperUser().then(() => {
        let query = 'SELECT datname FROM pg_database '
        if (!this.config.superUser) {
          query += 'JOIN pg_user ON usesysid = datdba WHERE usename = \'' + this.config.user + '\' AND datistemplate = false '
        } else {
          query += 'WHERE datistemplate = false '
        }
        query += 'ORDER BY datname;'
        return this.execute('', query)
        .then(results => {
          this.dbNames = []
          for (let i = 0; i < results[0].rows.length; i++) {
            this.dbNames.push(results[0].rows[i][0])
          }
          return this.dbNames
        })
        .catch(err => { this.dbNames = undefined; })
      })
      .catch(err => { this.dbNames = undefined; })
    }
    else
      return Promise.resolve(this.dbNames)
  }

  getSchemaNames(database) {
    let query = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE catalog_name = '` + database + `'
      ORDER BY catalog_name, schema_name, schema_owner`
    return this.execute(database, query)
      .then(results => {
        let schemaNameArray = []
        for (let i = 0; i < results[0].rows.length; i++) {
          schemaNameArray.push(results[0].rows[i][0])
        }
        return schemaNameArray
      })
      .catch(err => {
        return Promise.resolve([])
      })
  }

  getTables(database, schemaName) {
    let query = `
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = '` + schemaName + `'
      ORDER BY table_schema, table_type, table_name`
    return this.execute(database, query)
      .then(results => {
        let tables = []
        for (let i = 0; i < results[0].rows.length; i++) {
          tables.push({
            schemaName: results[0].rows[i][0],
            name: results[0].rows[i][1],
            type: results[0].rows[i][2] === 'BASE TABLE' ? 'Table' : 'View'
          })
        }
        return tables
      })
      .catch(err => {
        return Promise.resolve([])
      })
  }

  getTableDetails(database, tables) {
    tableNames = tables.map((t) => t.name)
    let sqlTables = "('" + tableNames.join("','") +  "')"

    return this.execute(database, 'select column_name, data_type, udt_name, character_maximum_length, table_name ' +
                           'from information_schema.columns ' +
                           'where table_schema || \'.\' || table_name IN ' + sqlTables +
                           'or table_name IN ' + sqlTables +
                           ' order by table_name, ordinal_position;')
    .then(results => {
      let columns = []
      for(let i = 0; i < results[0].rows.length; i++) {
        columns.push({
          name: results[0].rows[i][0],
          type: results[0].rows[i][1],
          udt: results[0].rows[i][2],
          size: results[0].rows[i][3],
          tableName: results[0].rows[i][4]
        })
      }
      return columns
    })
    .catch(err => {
      return Promise.resolve([])
    })
  }

  getTableQuery(tableName, schemaName) {
    return `
      SELECT *
      FROM "` + schemaName + `".` + tableName
  }

  getTableDescription(tableName, schemaName) {
    return `
      SELECT
        ordinal_position AS "Position",
        column_name AS "Column",
        data_type AS "Type",
        character_maximum_length,
        character_octet_length
        numeric_precision,
        numeric_precision_radix
        numeric_scale,
        datetime_precision,
        column_default As "Default",
        is_nullable AS "Nullable",
        character_set_name AS "Character Set",
        collation_name AS "Collation"
      FROM information_schema.columns
      WHERE table_schema = '` + schemaName + `'
        AND table_name = '` + tableName + `'
      ORDER BY ordinal_position`
  }

  getCreateStatement(tableName, schemaName) {
    /*
    echo  "CREATE TABLE ${SCHEMA}.${TABLE} ("
    psql -h ${SOURCEINSTANCE} -U ${SOURCEUSER} -p ${SOURCEPORT} ${SOURCEDB} -t -c "select (\"column\" || ' ' || type || ' ENCODE ' || encoding || ',' ) from pg_table_def where schemaname='$SCHEMA' and tablename = '$TABLE'" | sed 's/ENCODE none/ENCODE RAW/' | sed '$d' | sed '$ s/,$//'
    echo ")"
    SORTKEY=$(psql -h ${SOURCEINSTANCE} -U ${SOURCEUSER} -p ${SOURCEPORT} ${SOURCEDB} -t -c "select \"column\" from pg_table_def where schemaname='$SCHEMA' and tablename = '$TABLE' and sortkey > 0 order by sortkey" |  tr "\n" "," | sed 's/\([,]*\)$//')
    [ -n "$SORTKEY" ] && echo  "sortkey ($SORTKEY)"
    DESTKEY=$(psql -h ${SOURCEINSTANCE} -U ${SOURCEUSER} -p ${SOURCEPORT} ${SOURCEDB} -t -c "select \"column\" from pg_table_def where schemaname='$SCHEMA' and tablename = '$TABLE' and distkey = true" |  tr "\n" "," | sed 's/\([,]*\)$//')
    [ -n "$DESTKEY" ] && echo  "distkey ($DESTKEY)"
    echo ";"
    */
    return `
      SELECT ddl
      FROM
        (
        SELECT
         schemaname,
         tablename,
         seq,
         ddl
        FROM
         (
         SELECT
          schemaname,
          tablename,
          seq,
          ddl
         FROM
          (
          --DROP TABLE
          SELECT
           n.nspname AS schemaname
           ,c.relname AS tablename
           ,0 AS seq
           ,'--DROP TABLE "' + n.nspname + '"."' + c.relname + '";' AS ddl
          FROM pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          WHERE c.relkind = 'r'
          --CREATE TABLE
          UNION SELECT
           n.nspname AS schemaname
           ,c.relname AS tablename
           ,2 AS seq
           ,'CREATE TABLE IF NOT EXISTS "' + n.nspname + '"."' + c.relname + '"' AS ddl
          FROM pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          WHERE c.relkind = 'r'
          --OPEN PAREN COLUMN LIST
          UNION SELECT n.nspname AS schemaname, c.relname AS tablename, 5 AS seq, '(' AS ddl
          FROM pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          WHERE c.relkind = 'r'
          --COLUMN LIST
          UNION SELECT
           schemaname
           ,tablename
           ,seq
           ,'\t' + col_delim + col_name + ' ' + col_datatype + ' ' + col_nullable + ' ' + col_default + ' ' + col_encoding AS ddl
          FROM
           (
           SELECT
            n.nspname AS schemaname
            ,c.relname AS tablename
            ,100000000 + a.attnum AS seq
            ,CASE WHEN a.attnum > 1 THEN ',' ELSE '' END AS col_delim
            ,'"' + a.attname + '"' AS col_name
            ,CASE WHEN STRPOS(UPPER(format_type(a.atttypid, a.atttypmod)), 'CHARACTER VARYING') > 0
              THEN REPLACE(UPPER(format_type(a.atttypid, a.atttypmod)), 'CHARACTER VARYING', 'VARCHAR')
             WHEN STRPOS(UPPER(format_type(a.atttypid, a.atttypmod)), 'CHARACTER') > 0
              THEN REPLACE(UPPER(format_type(a.atttypid, a.atttypmod)), 'CHARACTER', 'CHAR')
             ELSE UPPER(format_type(a.atttypid, a.atttypmod))
             END AS col_datatype
            ,CASE WHEN format_encoding((a.attencodingtype)::integer) = 'none'
             THEN ''
             ELSE 'ENCODE ' + format_encoding((a.attencodingtype)::integer)
             END AS col_encoding
            ,CASE WHEN a.atthasdef IS TRUE THEN 'DEFAULT ' + adef.adsrc ELSE '' END AS col_default
            ,CASE WHEN a.attnotnull IS TRUE THEN 'NOT NULL' ELSE '' END AS col_nullable
           FROM pg_namespace AS n
           INNER JOIN pg_class AS c ON n.oid = c.relnamespace
           INNER JOIN pg_attribute AS a ON c.oid = a.attrelid
           LEFT OUTER JOIN pg_attrdef AS adef ON a.attrelid = adef.adrelid AND a.attnum = adef.adnum
           WHERE c.relkind = 'r'
             AND a.attnum > 0
           ORDER BY a.attnum
           )
          --CONSTRAINT LIST
          UNION (SELECT
           n.nspname AS schemaname
           ,c.relname AS tablename
           ,200000000 + CAST(con.oid AS INT) AS seq
           ,'\t,' + pg_get_constraintdef(con.oid) AS ddl
          FROM pg_constraint AS con
          INNER JOIN pg_class AS c ON c.relnamespace = con.connamespace AND c.oid = con.conrelid
          INNER JOIN pg_namespace AS n ON n.oid = c.relnamespace
          WHERE c.relkind = 'r' AND pg_get_constraintdef(con.oid) NOT LIKE 'FOREIGN KEY%'
          ORDER BY seq)
          --CLOSE PAREN COLUMN LIST
          UNION SELECT n.nspname AS schemaname, c.relname AS tablename, 299999999 AS seq, ')' AS ddl
          FROM pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          WHERE c.relkind = 'r'
          --BACKUP
          UNION SELECT
          n.nspname AS schemaname
           ,c.relname AS tablename
           ,300000000 AS seq
           ,'BACKUP NO' as ddl
        FROM pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          INNER JOIN (SELECT
            SPLIT_PART(key,'_',5) id
            FROM pg_conf
            WHERE key LIKE 'pg_class_backup_%'
            AND SPLIT_PART(key,'_',4) = (SELECT
              oid
              FROM pg_database
              WHERE datname = current_database())) t ON t.id=c.oid
          WHERE c.relkind = 'r'
          --BACKUP WARNING
          UNION SELECT
          n.nspname AS schemaname
           ,c.relname AS tablename
           ,1 AS seq
           ,'--WARNING: This DDL inherited the BACKUP NO property from the source table' as ddl
        FROM pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          INNER JOIN (SELECT
            SPLIT_PART(key,'_',5) id
            FROM pg_conf
            WHERE key LIKE 'pg_class_backup_%'
            AND SPLIT_PART(key,'_',4) = (SELECT
              oid
              FROM pg_database
              WHERE datname = current_database())) t ON t.id=c.oid
          WHERE c.relkind = 'r'
          --DISTSTYLE
          UNION SELECT
           n.nspname AS schemaname
           ,c.relname AS tablename
           ,300000001 AS seq
           ,CASE WHEN c.reldiststyle = 0 THEN 'DISTSTYLE EVEN'
            WHEN c.reldiststyle = 1 THEN 'DISTSTYLE KEY'
            WHEN c.reldiststyle = 8 THEN 'DISTSTYLE ALL'
            ELSE '<<Error - UNKNOWN DISTSTYLE>>'
            END AS ddl
          FROM pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          WHERE c.relkind = 'r'
          --DISTKEY COLUMNS
          UNION SELECT
           n.nspname AS schemaname
           ,c.relname AS tablename
           ,400000000 + a.attnum AS seq
           ,'DISTKEY ("' + a.attname + '")' AS ddl
          FROM pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          INNER JOIN pg_attribute AS a ON c.oid = a.attrelid
          WHERE c.relkind = 'r'
            AND a.attisdistkey IS TRUE
            AND a.attnum > 0
          --SORTKEY COLUMNS
          UNION select schemaname, tablename, seq,
               case when min_sort <0 then 'INTERLEAVED SORTKEY (' else 'SORTKEY (' end as ddl
        from (SELECT
           n.nspname AS schemaname
           ,c.relname AS tablename
           ,499999999 AS seq
           ,min(attsortkeyord) min_sort FROM pg_namespace AS n
          INNER JOIN  pg_class AS c ON n.oid = c.relnamespace
          INNER JOIN pg_attribute AS a ON c.oid = a.attrelid
          WHERE c.relkind = 'r'
          AND abs(a.attsortkeyord) > 0
          AND a.attnum > 0
          group by 1,2,3 )
          UNION (SELECT
           n.nspname AS schemaname
           ,c.relname AS tablename
           ,500000000 + abs(a.attsortkeyord) AS seq
           ,CASE WHEN abs(a.attsortkeyord) = 1
            THEN '\t"' + a.attname + '"'
            ELSE '\t, "' + a.attname + '"'
            END AS ddl
          FROM  pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          INNER JOIN pg_attribute AS a ON c.oid = a.attrelid
          WHERE c.relkind = 'r'
            AND abs(a.attsortkeyord) > 0
            AND a.attnum > 0
          ORDER BY abs(a.attsortkeyord))
          UNION SELECT
           n.nspname AS schemaname
           ,c.relname AS tablename
           ,599999999 AS seq
           ,'\t)' AS ddl
          FROM pg_namespace AS n
          INNER JOIN  pg_class AS c ON n.oid = c.relnamespace
          INNER JOIN  pg_attribute AS a ON c.oid = a.attrelid
          WHERE c.relkind = 'r'
            AND abs(a.attsortkeyord) > 0
            AND a.attnum > 0
          --END SEMICOLON
          UNION SELECT n.nspname AS schemaname, c.relname AS tablename, 600000000 AS seq, ';' AS ddl
          FROM  pg_namespace AS n
          INNER JOIN pg_class AS c ON n.oid = c.relnamespace
          WHERE c.relkind = 'r' )
          UNION (
            SELECT 'zzzzzzzz' AS schemaname,
               'zzzzzzzz' AS tablename,
               700000000 + CAST(con.oid AS INT) AS seq,
               'ALTER TABLE ' + n.nspname + '.' + c.relname + ' ADD ' + pg_get_constraintdef(con.oid)::VARCHAR(1024) + ';' AS ddl
            FROM pg_constraint AS con
              INNER JOIN pg_class AS c
                      ON c.relnamespace = con.connamespace
                     AND c.oid = con.conrelid
              INNER JOIN pg_namespace AS n ON n.oid = c.relnamespace
            WHERE c.relkind = 'r'
            AND   pg_get_constraintdef (con.oid) LIKE 'FOREIGN KEY%'
            ORDER BY seq
          )
         ORDER BY schemaname, tablename, seq
         )
        )
        WHERE schemaname = '` + schemaName + `'
          AND tablename = '` + tableName + `'
        ORDER by seq asc;
      `
  }
}
