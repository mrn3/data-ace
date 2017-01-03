# Data Ace package

Data Ace allows you to write and execute queries against your favorite databases (PostgreSQL, MS SQL Server, MySQL, Redshift) and visualize the results, all from within Atom. It supports autocomplete and exploring database information (tables, columns, views, etc.). The plan is to build it out with more data management functionality.

Feel free to open issues or make pull requests!

##Features
- Supports
  - Microsoft SQL Server
  - MySQL (Beta support, see issues for known problems)
  - PostgreSQL
  - Redshift
- Execute custom queries or a whole file
  - Separate results for each file/editor view
  - Different connections per editor view
- Autocomplete for table and column names
- Easily change the database/connection to execute against
- View meta information (tables, columns, views, etc.) for the connected database
- Check the execution time in the right of the status bar
- Save connections for easily connecting later

##Usage
- `F5` or 'Data Ace: Execute' command
  - Executes the current query source (see below) against the current connection. It will prompt if there is no current connection
  - Only executes the selected text if there is any
- `CMD`+`ALT`+`R` (Mac), `ALT`+`SHIFT`+`R` (Windows, Linux) or the 'Data Ace: Toggle Results View' command
  - Toggle results view
- `ALT`+`SHIFT`+`D` or the 'Data Ace: Toggle Details View' command
  - Toggle the database details view, showing table, column, view, etc. information

###Other commands
- 'Data Ace: Toggle Query Source' or the button right of 'Execute' on the toolbar
  - Toggle the source of the query to execute between the active editor content and Data Ace's own query editor
  - Allows you to easily work with SQL files in the main editor or quickly execute queries while working in any file type
- 'Data Ace: New Query'
  - Switch to use Data Ace's query input and focus to the keyboard there
- 'Data Ace: New Connection'
  - Launch the new connection dialog to add a new connection
- 'Data Ace: Toggle Query Source'
  - Toggle the source of the query between the active editor content (or selection) and Data Ace's own query input
- 'Data Ace: Edit Connections'
  - Open the saved connections file for editing

##Contributing
To contribute, do the following:
- Clone the repo
- Install the package (Atom -> Preferences... -> Install)
- Hack on the code
- Use ctrl-alt-cmd-L to refresh (reload all packages) to see your changes
- Submit a PR and I will get it merged quickly

Some details about the project that are relevant to contributors:
- It is written in ES6 using Babel (provided by Atom)
- Looking at implementing support for your favorite DB?
  - Check out `data-manager.js` for what you need to implement
  - See `postgres-manager.js` for the most complete example

##The Random TODO list
- Replace grid with something better to allow row selection, column selection etc.
- Manage saved connections
- Move callbacks I control to Promises
- Add support for other database systems. Submit an issue or comment on one already there so we know the priorities
- More database information and visualisation e.g.
  - Exploring relations, views, etc.
