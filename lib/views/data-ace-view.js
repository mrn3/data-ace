"use babel"

import DataResultView from './data-result-view'
import HeaderView from './header-view'
import utils from '../utils'

import {TextEditor, Emitter} from 'atom'

export default class DataAceView {
  constructor() {
    this.emitter = new Emitter()
    this.createView()
    this.querySection.style.display = 'none'
    this.isShowing = false
    this.resizeHandle.addEventListener('mousedown', e => this.resizeStarted(e))
  }

  createView() {
    this.element = document.createElement('section')
    this.element.className = 'data-ace data-ace-panel data-ace-results-panel tool-panel panel panel-bottom padding'

    this.resizeHandle = document.createElement('div')
    this.resizeHandle.classList.add('resize-handle')
    this.element.appendChild(this.resizeHandle)

    this.headerView = new HeaderView(false)
    this.element.appendChild(this.headerView.element)

    this.querySection = document.createElement('section')
    this.querySection.classList.add('query-section')
    this.element.appendChild(this.querySection)

    this.resultsView = new DataResultView()
    this.element.appendChild(this.resultsView.getElement())
  }

  useEditorAsQuerySource(useEditor) {
    this.headerView.toggleQuerySource(useEditor)
    if (useEditor) {
      this.querySection.style.display = 'none'
    }
    else {
      this.querySection.style.display = 'block'
    }
  }

  getQuery(useEditorAsQuery, useQueryAtCursor) {
    var editor = atom.workspace.getActiveTextEditor()
    if (useEditorAsQuery) {
      var selectedText = editor.getSelectedText()
      if (useQueryAtCursor && !selectedText) {
        var selectionRange = utils.getRangeForQueryAtCursor(editor)
        editor.setSelectedBufferRange(selectionRange)
        selectedText = editor.getSelectedText()
      }
      return selectedText ? selectedText : editor.getText()
    } 
  }

  setQuery(query) {
    var editor = atom.workspace.getActiveTextEditor()
    editor.setText(query)
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove()
  }

  show() {
    if (!this.isShowing)
      this.toggleView()
  }

  hide() {
    if (this.isShowing)
      this.toggleView()
  }

  toggleView() {
    if (this.isShowing) {
      this.element.parentNode.removeChild(this.element)
      this.isShowing = false
      this.viewPanel.destroy()
      this.viewPanel = null
    }
    else {
      this.viewPanel = atom.workspace.addBottomPanel({item:this.element})
      this.isShowing = true
    }
  }

  resizeStarted() {
    var self = this
    this.moveHandler = function(e) { self.resizeResultsView(e); }
    document.body.addEventListener('mousemove', this.moveHandler)
    this.stopHandler = function() { self.resizeStopped(); }
    document.body.addEventListener('mouseup', this.stopHandler)
  }

  resizeStopped() {
    document.body.removeEventListener('mousemove', this.moveHandler)
    document.body.removeEventListener('mouseup', this.stopHandler)
  }

  resizeResultsView(e) {
    var height = document.body.offsetHeight - e.pageY - (this.headerView.getHeight() -10)
    this.element.style.height = height + 'px'
  }

  clear() {
    // clear results view and show things are happening
    this.resultsView.clear()
  }

  onQueryCancel(onQueryCancelFunc) {
    return this.emitter.on('data-ace-query-cancel', onQueryCancelFunc)
  }

  setMessage(message) {
    this.resultsView.setMessage(message)
  }

  setResults(results) {
    this.resultsView.setResults(results)
  }

  getSelectedLimit() {
    return this.headerView.getSelectedLimit()
  }

  // Let us know that execution has begun. Chance for us to disbale any cnotrols etc.
  executionBegin() {
    this.headerView.executionBegin()
  }
  // Let us know that execution has ended. Chance to re-enable controls etc.
  executionEnd() {
    this.headerView.executionEnd()
  }
}
