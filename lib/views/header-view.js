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
      selectedLimit: '10',
      useEditorQuery: useEditorQuery
    }

    this.emitter = new Emitter()
    etch.initialize(this)

    this.refs.executeBtn.addEventListener('click', () => { this.executeQuery() })
    this.refs.cancelBtn.addEventListener('click', () => { this.emitter.emit('data-ace-query-cancel') })
    this.refs.limit.addEventListener('change', (e) => { this.limitSelected(e) })
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
      <button className='btn btn-default btn-query-execute' disabled={!this.state.selectedDb || this.state.isExecuting} ref='executeBtn'>Execute</button>
      <button className='btn btn-default btn-query-cancel' disabled={!this.state.isExecuting} ref='cancelBtn'>Cancel</button>
      <span className='db-label'>Limit:</span>
      <select ref='limit'>
        <option value='10'>10</option>
        <option value='100'>100</option>
        <option value='1000'>1000</option>
        <option value='none'>None</option>
      </select>
      <span className='heading-close icon-remove-close pull-right' ref='closeBtn'></span>
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

  limitSelected(e) {
    this.state.selectedLimit = e.target.options[e.target.selectedIndex].value
    etch.update(this)
    this.emitter.emit('data-ace-limit-changed')
  }

  getSelectedLimit() {
    return this.state.selectedLimit
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
