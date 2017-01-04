"use babel"
/** @jsx etch.dom */

import etch from 'etch'
import TableView from './table-view'

export default class DataResultView {
  constructor() {
    this.state = {
      message: null,
      results: []
    }
    etch.initialize(this)
  }

  update(props, children) {
    return etch.update(this)
  }

  render() {
    let content
    let resultCount = 0
    if (this.state.message) {
      let content = this.state.message.split('\n').map(line => <div>{line}</div>)
    }
    else {
      if (this.state.results[0] && this.state.results[0].rows) {
        resultCount = this.state.results[0].rows.length
      }
      content = this.state.results.map(result =>
        result.message ?
          <span className='text-selectable result-message' tabIndex='-1'>{result.message}</span>
        :
          <div className='result-table'>
            <TableView columns={result.fields} rows={result.rows} />
          </div>
      )
    }
    return <div className='results-section'>
      <span className='heading-title'>Results ({resultCount}):</span>
      {content}
    </div>
  }

  getElement() {
    return this.element
  }

  clear() {
    this.state.message = null
    this.state.results = []
    etch.update(this)
  }

  setResults(results) {
    this.state.message = null
    this.state.results = results
    etch.update(this)
  }

  setMessage(msg) {
    this.state.results = []
    this.state.message = msg
    etch.update(this)
  }
}
