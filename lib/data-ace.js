"use babel";

import DataAceController from './data-ace-controller';
import StatusBarManager from './status-bar-manager';
import InsertMetaProvider from './providers/insert-meta-provider';
import SQLMetaProvider from './providers/sql-meta-provider';

export default {
  provide: function() {
    return [InsertMetaProvider, SQLMetaProvider];
  },

  config: {
    showDetailsViewOnRightSide: {
      type: 'boolean',
      default: true,
    },
    openDetailsViewWhenOpeningMainResultsView: {
      type: 'boolean',
      default: true,
    },
    useQueryAtCursor: {
      type: 'boolean',
      default: true,
      description: 'If checked, only execute the query at the active cursor; otherwise, use the entire buffer\'s text.'
    }
  },

  activate: function(state) {
    this.statusBarManager = new StatusBarManager();
    this.dataAceController = new DataAceController(state, this.statusBarManager);
  },

  deactivate: function() {
    this.dataAceController.destroy();
    this.statusBarManager.detach();
  },

  serialize: function() {
    dataAceConrtollerState: this.dataAceController.serialize();
  },

  consumeStatusBar: function(statusBar) {
    this.statusBarManager.attachTo(statusBar);
  }
};
