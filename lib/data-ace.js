'use babel';

import DataAceView from './data-ace-view';
import { CompositeDisposable } from 'atom';

export default {

  dataAceView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.dataAceView = new DataAceView(state.dataAceViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.dataAceView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'data-ace:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.dataAceView.destroy();
  },

  serialize() {
    return {
      dataAceViewState: this.dataAceView.serialize()
    };
  },

  toggle() {
    console.log('DataAce was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
