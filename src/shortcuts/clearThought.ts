import Shortcut from '../@types/Shortcut'
import * as selection from '../device/selection'
import { cursorClearedActionCreator as cursorCleared } from '../reducers/cursorCleared'
import isDocumentEditable from '../util/isDocumentEditable'

const clearThoughtShortcut: Shortcut = {
  id: 'clearThought',
  label: 'Clear Thought',
  description: 'Clear the text of the current thought. A quick recovery after you have changed your mind.',
  gesture: 'rl',
  keyboard: { key: 'c', alt: true, shift: true, meta: true },
  canExecute: getState => isDocumentEditable() && !!getState().cursor,
  exec: (dispatch, getState) => {
    const isCursorCleared = getState().cursorCleared

    dispatch(cursorCleared({ value: !isCursorCleared }))

    // if toggling off, remove the browser selection
    if (isCursorCleared) {
      selection.clear()
    }
  },
}

export default clearThoughtShortcut
