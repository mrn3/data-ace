"use babel"
/** @jsx etch.dom */

import etch from 'etch'
import {Emitter} from 'atom'
import {CompositeDisposable} from 'atom'

// The header view for the results view, allowing you to add/change connections or change the DB
export default class DataAceHeaderView {
  constructor(useEditorQuery) {
    this.state = {
      isExecuting: false,
      selectedDb: '',
      selectedConnection: '',
      connections: [],
      databases: [],
      useEditorQuery: useEditorQuery
    }

    this.emitter = new Emitter()
    etch.initialize(this)

    this.refs.connectionBtn.addEventListener('click', () => { this.newConnection() })
    this.refs.disconnectBtn.addEventListener('click', () => { this.disconnect() })
    this.refs.connectionList.addEventListener('change', (e) => { this.connectionSelected(e) })
    this.refs.databaseList.addEventListener('change', (e) => { this.databaseSelected(e) })
    this.refs.closeBtn.addEventListener('click', () => { this.close() })

    this.subscriptions = new CompositeDisposable()
    /*
    this.subscriptions.add(atom.tooltips.add(this.refs.executeBtn, {
      title: 'Execute',
      keyBindingCommand: 'data-ace:execute'
    }))
    this.subscriptions.add(atom.tooltips.add(this.refs.cancelBtn, {title: 'Cancel execution [when a query is executing]'}))
    this.subscriptions.add(atom.tooltips.add(this.refs.connectionBtn, {title: 'Add new connection'}))
    this.subscriptions.add(atom.tooltips.add(this.refs.disconnectBtn, {title: 'Disconnect current connection'}))
    */
  }

  deconstructor() {
    console.log('gone')
    this.subscriptions.dispose()
  }

  update(props, children) {
    return etch.update(this)
  }

  render() {
    return (<header className='header toolbar'>
      <span className='heading-connection-title'>Connection:</span>
      <span className='heading-close icon-remove-close pull-right' ref='closeBtn'></span>
      <select ref='connectionList'>
        <option value='0' disabled='true'>Select connection...</option>
        {this.state.connections.map(con =>
          <option value={con} selected={con == this.state.selectedConnection}>{con}</option>
        )}
      </select>
      <br />
      <button className='btn btn-default btn-connect' ref='connectionBtn'></button>
      <button className='btn btn-default btn-disconnect' ref='disconnectBtn' disabled={this.state.connections.length == 0}></button>
      <br />
      <br />
      <span className='db-label'>Database:</span>
      <br />
      <select className='db-select' ref='databaseList'>
        <option value='data-ace:select-db' disabled='true'>Select database...</option>
        {this.state.databases.map(db =>
          <option value={db} selected={db == this.state.selectedDb}>{db}</option>
        )}
      </select>
    </header>)
  }

  getHeight() {
    return this.element.offsetHeight
  }

  close() {
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'data-ace:toggle-results-view')
  }

  databaseSelected(e) {
    this.state.selectedDb = e.target.options[e.target.selectedIndex].value
    etch.update(this)
    this.emitter.emit('data-ace-database-changed')
  }

  connectionSelected(e) {
    this.state.selectedConnection = e.target.options[e.target.selectedIndex].value
    etch.update(this)
    this.emitter.emit('data-ace-connection-changed')
  }

  addConnection(connectionName) {
    this.state.connections.push(connectionName)
    etch.update(this)
  }

  addDbNames(names) {
    this.state.databases = names || []
    etch.update(this)
  }

  setSelectedDbName(name) {
    if (name == null) {
      name = 'data-ace:select-db'
    }
    this.state.selectedDb = name
    etch.update(this)
  }

  clearDatabaseSelection() {
    this.state.databases = []
    etch.update(this)
  }

  setConnection(connectionName) {
    this.state.selectedConnection = connectionName
    etch.update(this)
  }

  getSelectedConnection() {
    return this.state.selectedConnection
  }

  getSelectedDatabase() {
    return this.state.selectedDb
  }

  newConnection() {
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'data-ace:new-connection')
  }

  disconnect() {
    var i = this.state.connections.indexOf(this.state.selectedConnection)
    if (i != -1)
      this.state.connections.splice(i, 1)

    this.state.selectedConnection = ''
    this.state.selectedDb = ''
    this.state.databases = []
    etch.update(this)
    this.emitter.emit('data-ace-disconnect')
    this.emitter.emit('data-ace-connection-changed')
  }

  onDisconnect(onFunc) {
    return this.emitter.on('data-ace-disconnect', onFunc)
  }

  executeQuery() {
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'data-ace:execute')
  }

  toggleQuerySource(useEditorQuery) {
    this.state.useEditorQuery = useEditorQuery
    etch.update(this)
  }

  onConnectionChanged(onConnectionChangedFunc) {
    return this.emitter.on('data-ace-connection-changed', onConnectionChangedFunc)
  }

  onDatabaseChanged(onDatabaseChangedFunc) {
    return this.emitter.on('data-ace-database-changed', onDatabaseChangedFunc)
  }

  onQueryCancel(onQueryCancelFunc) {
    return this.emitter.on('data-ace-query-cancel', onQueryCancelFunc)
  }

  // Let us know that execution has begun. Chance for us to disbale any cnotrols etc.
  executionBegin() {
    this.state.isExecuting = true
    etch.update(this)
  }
  // Let us know that execution has ended. Chance to re-enable controls etc.
  executionEnd() {
    this.state.isExecuting = false
    etch.update(this)
  }
}
