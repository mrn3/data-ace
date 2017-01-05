"use babel"

import DataAce from '../lib/data-ace'

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe("DataAce", () => {
  activationPromise = null

  // beforeEach ->
  //   atom.workspaceView = new WorkspaceView
  //   activationPromise = atom.packages.activatePackage('data-ace')
  //
  // describe "when the data-ace:toggle event is triggered", ->
  //   it "attaches and then detaches the view", ->
  //     expect(atom.workspaceView.find('.data-ace')).not.toExist()
  //
  //     # This is an activation event, triggering it will cause the package to be
  //     # activated.
  //     atom.workspaceView.trigger 'data-ace:toggle'
  //
  //     waitsForPromise ->
  //       activationPromise
  //
  //     runs ->
  //       expect(atom.workspaceView.find('.data-ace')).toExist()
  //       atom.workspaceView.trigger 'data-ace:toggle'
  //       expect(atom.workspaceView.find('.data-ace')).not.toExist()
})
