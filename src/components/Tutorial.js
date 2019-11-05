import assert from 'assert'
import React from 'react'
import { connect } from 'react-redux'
import * as classNames from 'classnames'
import { isMobile, isMac } from '../browser.js'

// constants
import {
  ROOT_TOKEN,
  TUTORIAL_STEP_START,
  TUTORIAL_STEP_FIRSTTHOUGHT,
  TUTORIAL_STEP_FIRSTTHOUGHT_ENTER,
  TUTORIAL_STEP_SECONDTHOUGHT,
  TUTORIAL_STEP_SECONDTHOUGHT_HINT,
  TUTORIAL_STEP_SECONDTHOUGHT_ENTER,
  TUTORIAL_STEP_SUBTHOUGHT,
  TUTORIAL_STEP_SUBTHOUGHT_ENTER,
  TUTORIAL_STEP_AUTOEXPAND,
  TUTORIAL_STEP_AUTOEXPAND_EXPAND,
  TUTORIAL_STEP_SUCCESS,
  TUTORIAL_STEP_NONE,
  TUTORIAL2_STEP_START,
  TUTORIAL2_STEP_CHOOSE,
  TUTORIAL2_STEP_CONTEXT1_PARENT,
  TUTORIAL2_STEP_CONTEXT1,
  TUTORIAL2_STEP_CONTEXT1_SUBTHOUGHT,
  TUTORIAL2_STEP_CONTEXT2_PARENT,
  TUTORIAL2_STEP_CONTEXT2,
  TUTORIAL2_STEP_CONTEXT2_SUBTHOUGHT,
  TUTORIAL2_STEP_CONTEXT_VIEW_SELECT,
  TUTORIAL2_STEP_CONTEXT_VIEW_TOGGLE,
  TUTORIAL2_STEP_CONTEXT_VIEW_OPEN,
  TUTORIAL2_STEP_CONTEXT_VIEW_EXAMPLES,
  TUTORIAL2_STEP_SUCCESS,
  TUTORIAL_CONTENT_TODO,
  TUTORIAL_CONTENT_JOURNAL,
  TUTORIAL_CONTENT_ACADEMIC,
  TUTORIAL_CONTEXT1,
  TUTORIAL_CONTEXT2,
} from '../constants.js'

import {
  tutorialNext,
  tutorialPrev,
  isHint,
} from '../action-creators/tutorial.js'

import {
  formatKeyboardShortcut,
  shortcutById,
} from '../shortcuts.js'

import {
  getChildrenWithRank,
  getContexts,
  encodeItems,
  intersections,
  isRoot,
  isTutorial,
  joinConjunction,
  sigKey,
  signifier,
  unrank,
} from '../util.js'

// components
import { GestureDiagram } from './GestureDiagram.js'
import { StaticSuperscript } from './StaticSuperscript.js'
import { TutorialHint } from './TutorialHint.js'

// assert shortcut at load time
const newThoughtShortcut = shortcutById('newThought')
assert(newThoughtShortcut)

// returns true if the first context item has been created, e.g. /Home/To Do/x
const context1SubthoughtCreated = ({ rootChildren, tutorialContent }) =>
  // e.g. Home
  rootChildren.find(child => child.key.toLowerCase() === TUTORIAL_CONTEXT1[tutorialContent].toLowerCase()) &&
  // e.g. Home/To Do
  getChildrenWithRank([TUTORIAL_CONTEXT1[tutorialContent]]).find(child => child.key.toLowerCase() === tutorialContent.toLowerCase()) &&
  // e.g. Home/To Do/x
  getChildrenWithRank([TUTORIAL_CONTEXT1[tutorialContent], tutorialContent]).length > 0

// returns true if the first context item has been created, e.g. /Work/To Do/y
const context2SubthoughtCreated = ({ rootChildren, tutorialContent }) =>
  // e.g. Work
  rootChildren.find(child => child.key.toLowerCase() === TUTORIAL_CONTEXT2[tutorialContent].toLowerCase()) &&
  // e.g. Work/To Do
  getChildrenWithRank([TUTORIAL_CONTEXT2[tutorialContent]]).find(child => child.key.toLowerCase() === tutorialContent.toLowerCase()) &&
  // e.g. Work/To Do/y
  getChildrenWithRank([TUTORIAL_CONTEXT2[tutorialContent], tutorialContent]).length > 0

const TutorialNext = connect(({ contextChildren, cursor, expanded, settings: { tutorialContent, tutorialStep } = {} }) => ({ contextChildren, cursor, expanded, tutorialContent, tutorialStep }))(({ contextChildren, cursor, expanded, tutorialContent, tutorialStep }) => {

  const rootChildren = contextChildren[encodeItems([ROOT_TOKEN])] || []
  return [
    TUTORIAL_STEP_START,
    TUTORIAL_STEP_SUCCESS,
    TUTORIAL2_STEP_START,
    TUTORIAL2_STEP_CONTEXT_VIEW_OPEN,
    TUTORIAL2_STEP_CONTEXT_VIEW_EXAMPLES,
    TUTORIAL2_STEP_SUCCESS,
  ].includes(tutorialStep) ||
    (tutorialStep === TUTORIAL_STEP_AUTOEXPAND && Object.keys(expanded).length === 0)||
    ((tutorialStep === TUTORIAL_STEP_FIRSTTHOUGHT_ENTER ||
      tutorialStep === TUTORIAL_STEP_SECONDTHOUGHT_ENTER ||
      tutorialStep === TUTORIAL_STEP_SUBTHOUGHT_ENTER
      ) && (!cursor || sigKey(cursor).length > 0)) ||
    (Math.floor(tutorialStep) === TUTORIAL2_STEP_CONTEXT1_SUBTHOUGHT && context1SubthoughtCreated({ rootChildren, tutorialContent })) ||
    (Math.floor(tutorialStep) === TUTORIAL2_STEP_CONTEXT2_SUBTHOUGHT && context2SubthoughtCreated({ rootChildren, tutorialContent }))
    ? <a className='tutorial-button button button-variable-width' onClick={tutorialNext}>{tutorialStep === TUTORIAL_STEP_SUCCESS || tutorialStep === TUTORIAL2_STEP_SUCCESS ? 'Finish' : 'Next'}</a>
    : <span className='tutorial-next-wait text-small'>Complete the instructions to continue</span>
})

const TutorialPrev = ({ tutorialStep }) => <a className={classNames({
  'tutorial-prev': true,
  button: true,
  'button-variable-width': true
})} disabled={tutorialStep === TUTORIAL_STEP_START} onClick={() => tutorialPrev(tutorialStep) }>Prev</a>

export const Tutorial = connect(({ contextChildren, cursor, data, settings: { tutorialContent, tutorialStep } = {} }) => ({ contextChildren, cursor, data, tutorialContent, tutorialStep }))(({ contextChildren, cursor, data, tutorialContent, tutorialStep, dispatch }) => {

  if (!isTutorial()) return null

  const rootChildren = contextChildren[encodeItems([ROOT_TOKEN])] || []

  // a thought in the root that is not the cursor
  const rootChildNotCursor = () => cursor
    ? rootChildren.find(child => unrank(cursor).indexOf(child.key) === -1)
    : getChildrenWithRank([rootChildren[0]]).length > 0 ? rootChildren[1] : rootChildren[0]

  // a thought in the root that is not the cursor and has children
  const rootChildNotCursorWithChildren = () =>
    rootChildren.find(child =>
      (!cursor || unrank(cursor).indexOf(child.key) === -1) &&
      getChildrenWithRank([child]).length > 0
    )

  // a child of a thought in the root that is not the cursor
  const rootGrandchildNotCursor = () => {
    const uncle = rootChildNotCursorWithChildren()
    return uncle ? getChildrenWithRank([uncle])[0] : null
  }

  return <div className='tutorial'><div className='tutorial-inner'>
    <a className='upper-right tutorial-skip text-small' style={{ visibility: tutorialStep !== TUTORIAL_STEP_SUCCESS && tutorialStep !== TUTORIAL2_STEP_SUCCESS ? 'visible' : 'hidden' }} onClick={() => dispatch({ type: 'tutorialStep', value: TUTORIAL_STEP_NONE })}>✕ close tutorial</a>
    <div className='clear'>
      <div className='tutorial-text'>
      {{

        [TUTORIAL_STEP_START]: <React.Fragment>
          <p>Welcome to your personal thoughtspace.</p>
          <p>Don't worry. I will walk you through everything you need to know.</p>
          <p>Let's begin...</p>
        </React.Fragment>,

        [TUTORIAL_STEP_FIRSTTHOUGHT]: <React.Fragment>
          <p>First, let me show you how to create a new thought in <b>em</b> using a {isMobile ? 'gesture' : 'keyboard shortcut'}. Just follow the instructions; this tutorial will stay open.</p>
          <p>{isMobile ? 'Trace the line below with your finger' : 'Hit the Enter key'} to create a new thought.</p>
        </React.Fragment>,

        [TUTORIAL_STEP_FIRSTTHOUGHT_ENTER]: <React.Fragment>
          <p>You did it!</p>
          {!cursor || sigKey(cursor).length > 0 ? <p>{isMobile ? 'Tap' : 'Click'} the Next button when you are done entering your thought.</p> : <p>Now type something. Anything will do.</p>}
        </React.Fragment>,

        [TUTORIAL_STEP_SECONDTHOUGHT]: <React.Fragment>
          <p>Well done!</p>
          <p>Try adding another thought. Do you remember how to do it?
            <TutorialHint>
              <br/><br/>{isMobile ? 'Trace the line below with your finger' : 'Hit the Enter key'} to create a new thought.
            </TutorialHint>
          </p>
        </React.Fragment>,

        [TUTORIAL_STEP_SECONDTHOUGHT_ENTER]: <React.Fragment>
          <p>Good work!</p>
          <p>{isMobile ? <React.Fragment>Swiping <GestureDiagram path={newThoughtShortcut.gesture} size='28' style={{ margin: '-10px -4px -6px' }} /></React.Fragment> : 'Hitting Enter'} will always create a new thought <i>after</i> the currently selected thought.</p>
          {!cursor || sigKey(cursor).length > 0 ? <p>Wonderful. Click the Next button when you are ready to continue.</p> : <p>Now type some text for the new thought.</p>}
        </React.Fragment>,

        [TUTORIAL_STEP_SUBTHOUGHT]: <div>
          <p>Now I am going to show you how to add a thought <i>within</i> another thought.</p>
          {cursor && sigKey(cursor) === '' ? <p>Hit the Delete key to delete the current blank thought. It's not needed right now.</p> : null}
          {!cursor ? <p>{isMobile ? 'Tap' : 'Click'} a thought to select it.</p> : <p>{isMobile ? 'Trace the line below' : `${cursor && sigKey(cursor) === '' ? 'Then h' : 'H'}old the ${isMac ? 'Command' : 'Ctrl'} key and hit the Enter key`}.</p>}
        </div>,

        [TUTORIAL_STEP_SUBTHOUGHT_ENTER]: <React.Fragment>
          <p>As you can see, the new thought{cursor && cursor.length > 1 && sigKey(cursor).length > 0 ? <React.Fragment> "{sigKey(cursor)}"</React.Fragment> : null} is nested <i>within</i> {cursor && cursor.length > 1 ? <React.Fragment>"{sigKey(intersections(cursor))}"</React.Fragment> : 'the other thought'}. This is useful for using a thought as a category, for example, but the exact meaning is up to you.</p>
          <p>You can create thoughts within thoughts within thoughts. There is no limit.</p>
          {!cursor || sigKey(cursor).length > 0 ? <p>Click the Next button when you are ready to continue.</p> : <p>Feel free to type some text for the new thought.</p>}
        </React.Fragment>,

        [TUTORIAL_STEP_AUTOEXPAND]: <React.Fragment>
          <p>Thoughts <i>within</i> thoughts are automatically hidden when you {isMobile ? 'tap' : 'click'} away. {cursor
            ? <React.Fragment>Try {rootChildren.length > 1 && rootChildNotCursor()
              ? <React.Fragment>{isMobile ? 'tapping' : 'clicking'} on {rootChildNotCursor()
                ? `"${rootChildNotCursor().key}"`
                : 'it'
              }</React.Fragment>
              : rootChildren.length <= 1 && !rootChildNotCursor() ? <React.Fragment>creating a new thought{rootChildren.length === 1 ? <React.Fragment> after "{rootChildren[0].key}"</React.Fragment> : null}</React.Fragment>
              : `${isMobile ? 'tapping' : 'clicking'} in the blank area`} to hide the subthought{cursor && cursor.length > 1
                ? ` "${sigKey(cursor)}"`
                : cursor
                  ? ` "${getChildrenWithRank(cursor)[0] && getChildrenWithRank(cursor)[0].key}"`
                  : null
              }.</React.Fragment>
            : ''
            }
          </p>
        </React.Fragment>,

        [TUTORIAL_STEP_AUTOEXPAND_EXPAND]: <React.Fragment>
          {rootGrandchildNotCursor() ? <p>Notice that "{rootGrandchildNotCursor().key}" is hidden now.</p> : ''}
          <p>There are no files to open or close in <b>em</b>. All of your thoughts are in one place. But it stays organized because only the selected thought and the thoughts immediately within it are visible.</p>
          <p>{isMobile ? 'Tap' : 'Click'} {rootChildNotCursorWithChildren() ? `"${rootChildNotCursorWithChildren().key}"` : 'a thought'} to reveal its subthought{rootGrandchildNotCursor() ? ` "${rootGrandchildNotCursor().key}"` : null}.</p>
        </React.Fragment>,

        [TUTORIAL_STEP_SUCCESS]: <React.Fragment>
          <p>Congratulations... You have completed Part <span style={{ fontFamily: 'serif'}}>I</span> of the tutorial. You can organize a lot of thoughts with what you've learned.</p>
          <p>How are you feeling? Would you like to learn more or play on your own?</p>
        </React.Fragment>,

        // Part II: Connected Thoughts

        [TUTORIAL2_STEP_START]: <React.Fragment>
          <p>If the same thought appears in more than one place, <b>em</b> shows a small number to the right of the thought, for example: (<StaticSuperscript n={3} />).</p>
          <p>Let's see this in action.</p>
        </React.Fragment>,

        [TUTORIAL2_STEP_CHOOSE]: <React.Fragment>
          <p>This time, you get to choose what kind of content you create. You will learn the same command regardless of which one you choose.</p>
        </React.Fragment>,

        [TUTORIAL2_STEP_CONTEXT1_PARENT]: <React.Fragment>
          <p>Create a new thought with the text “{TUTORIAL_CONTEXT1[tutorialContent]}”{cursor && sigKey(cursor).startsWith('"') ? ' (without quotes)' : null}.</p>
          <p>You should create this thought at the top level, i.e. not <i>within</i> any other thoughts.
            <TutorialHint>
              <br/><br/>{
                rootChildren.length > 0 && (!cursor || cursor.length > 1)
                  ? <React.Fragment>Select {rootChildren.length === 1 ? 'the top-level thought' : 'one of the top-level thoughts'} ({joinConjunction(rootChildren.map(child => `"${child.key}"`), 'or')}). </React.Fragment>
                  : null
                }{isMobile ? 'Trace the line below with your finger' : `Hit the Enter key`} to create a new thought.
            </TutorialHint>
          </p>
        </React.Fragment>,

        [TUTORIAL2_STEP_CONTEXT1]: <React.Fragment>
          <p>Now add a thought with the text "{tutorialContent}" <i>within</i> “{TUTORIAL_CONTEXT1[tutorialContent]}”.</p>
          {rootChildren.find(child => child.key.toLowerCase() === TUTORIAL_CONTEXT1[tutorialContent].toLowerCase())
            ? <p>Do you remember how to do it?
              <TutorialHint>
                <br/><br/>{cursor && cursor.length === 2 && cursor[0].key.toLowerCase() === TUTORIAL_CONTEXT1[tutorialContent].toLowerCase()
                  ? `Type "${tutorialContent}."`
                  : <React.Fragment>{!cursor || sigKey(cursor).toLowerCase() !== TUTORIAL_CONTEXT1[tutorialContent].toLowerCase() ? `Select "${TUTORIAL_CONTEXT1[tutorialContent]}". ` : null}{isMobile ? 'Trace the line below with your finger' : `Hold ${isMac ? 'Command' : 'Ctrl'} and hit Enter`} to create a new thought <i>within</i> "{TUTORIAL_CONTEXT1[tutorialContent]}".</React.Fragment>
                }
              </TutorialHint>
            </p>
           : <p>Oops, somehow “{TUTORIAL_CONTEXT1[tutorialContent]}” was changed or deleted. Click the Prev button to go back.</p>
          }
        </React.Fragment>,

        [TUTORIAL2_STEP_CONTEXT1_SUBTHOUGHT]:
          context1SubthoughtCreated({ rootChildren, tutorialContent })
            ? <React.Fragment>
              <p>Nice work!</p>
              <p>{isMobile ? 'Tap' : 'Click'} the Next button when you are done entering your item.</p>
            </React.Fragment>
            : <React.Fragment>
              <p>Now add an item to “{tutorialContent}”.</p>
              {
                // e.g. Home
                rootChildren.find(child => child.key.toLowerCase() === TUTORIAL_CONTEXT1[tutorialContent].toLowerCase()) &&
                // e.g. Home/To Do
                getChildrenWithRank([TUTORIAL_CONTEXT1[tutorialContent]]).find(child => child.key.toLowerCase() === tutorialContent.toLowerCase())
                ? <p>Do you remember how to do it?
                  <TutorialHint>
                    <br/><br/>
                    {!cursor || sigKey(cursor).toLowerCase() !== tutorialContent.toLowerCase()? `Select "${tutorialContent}". ` : null}
                    {isMobile ? 'Trace the line below with your finger ' : `Hold ${isMac ? 'Command' : 'Ctrl'} and hit Enter `}
                    to create a new thought <i>within</i> "{tutorialContent}".
                  </TutorialHint>
                </p>
                : <p>Oops, somehow “{tutorialContent}” was changed or deleted. Click the Prev button to go back.</p>
              }
            </React.Fragment>,

        [TUTORIAL2_STEP_CONTEXT2_PARENT]: <React.Fragment>
          <p>Now we are going to create a different "{tutorialContent}" list.</p>
          <p>Create a new thought with the text “{TUTORIAL_CONTEXT2[tutorialContent]}”{cursor && sigKey(cursor).startsWith('"') ? ' (without quotes)' : null} <i>after</i> "{TUTORIAL_CONTEXT1[tutorialContent]}" (but at the same level).
            <TutorialHint>
              <br/><br/>{
                rootChildren.length > 0 && (!cursor || cursor.length > 1)
                  ? <React.Fragment>Select "{TUTORIAL_CONTEXT1[tutorialContent]}." </React.Fragment>
                  : null
                }{isMobile ? 'Trace the line below with your finger' : `Hit the Enter key`} to create a new thought <i>after</i> "{TUTORIAL_CONTEXT1[tutorialContent]}". Then type "{TUTORIAL_CONTEXT2[tutorialContent]}".
            </TutorialHint>
          </p>
        </React.Fragment>,

        [TUTORIAL2_STEP_CONTEXT2]: <React.Fragment>
          <p>Now add a thought with the text "{tutorialContent}" <i>within</i> “{TUTORIAL_CONTEXT2[tutorialContent]}”.</p>
          {
            // e.g. Work
            rootChildren.find(child => child.key.toLowerCase() === TUTORIAL_CONTEXT2[tutorialContent].toLowerCase())
            ? <p>Do you remember how to do it?
              <TutorialHint>
                <br/><br/>{cursor && cursor.length === 2 && cursor[0].key === TUTORIAL_CONTEXT2[tutorialContent]
                  ? `Type "${tutorialContent}."`
                  : <React.Fragment>{!cursor || sigKey(cursor) !== TUTORIAL_CONTEXT2[tutorialContent] ? `Select "${TUTORIAL_CONTEXT2[tutorialContent]}". ` : null}{isMobile ? 'Trace the line below with your finger' : `Hold ${isMac ? 'Command' : 'Ctrl'} and hit Enter`} to create a new thought <i>within</i> "{TUTORIAL_CONTEXT2[tutorialContent]}".</React.Fragment>
                }
              </TutorialHint>
            </p>
            : <p>Oops, somehow “{TUTORIAL_CONTEXT2[tutorialContent]}” was changed or deleted. Click the Prev button to go back.</p>
          }
        </React.Fragment>,

        [TUTORIAL2_STEP_CONTEXT2_SUBTHOUGHT]: (() => {

          const caseSensitiveValue = getContexts(tutorialContent).length > 0 ? tutorialContent : tutorialContent.toLowerCase()
          const contexts = getContexts(caseSensitiveValue)

          return context2SubthoughtCreated({ rootChildren, tutorialContent })
            ? <React.Fragment>
              <p>Nice work!</p>
              <p>{isMobile ? 'Tap' : 'Click'} the Next button when you are done entering your item.</p>
            </React.Fragment>
            : <React.Fragment>
              <p>Very good!</p>
              <p>Notice the small number (<StaticSuperscript n={contexts.length} />). This means that “{caseSensitiveValue}” appears in {contexts.length} place{contexts.length === 1 ? '' : 's'}, or <i>contexts</i> (in our case {joinConjunction(contexts
                  .filter(parent => !isRoot(parent))
                  .map(parent => `"${signifier(parent.context)
                }"`))}).</p>
              <p>Now add an item to this new “{tutorialContent}” list.</p>
              {
                // e.g. Work
                rootChildren.find(child => child.key.toLowerCase() === TUTORIAL_CONTEXT2[tutorialContent].toLowerCase()) &&
                // e.g. Work/To Do
                getChildrenWithRank([TUTORIAL_CONTEXT2[tutorialContent]]).find(child => child.key.toLowerCase() === tutorialContent.toLowerCase())
                ? <p>Do you remember how to do it?
                  <TutorialHint>
                    <br/><br/>
                    {!cursor || sigKey(cursor).toLowerCase() !== tutorialContent.toLowerCase()? `Select "${tutorialContent}". ` : null}
                    {isMobile ? 'Trace the line below with your finger ' : `Hold ${isMac ? 'Command' : 'Ctrl'} and hit Enter `}
                    to create a new thought <i>within</i> "{tutorialContent}".
                  </TutorialHint>
                </p>
                : <p>Oops, somehow “{tutorialContent}” was changed or deleted. Click the Prev button to go back.</p>
              }
            </React.Fragment>
        })(),

        // [TUTORIAL2_STEP_SUBTHOUGHT2]: <React.Fragment>
        //   <p>Now create a new thought with the text “{TUTORIAL_CONTEXT2[tutorialContent]}”{cursor && sigKey(cursor).startsWith('"') ? ' (without quotes)' : null}.</p>
        //   <p>You should create this thought at the top level, next to "{TUTORIAL_CONTEXT1[tutorialContent]}".
        //     <TutorialHint>
        //       <br/><br/>{
        //         rootChildren.length > 0 && (!cursor || cursor.length > 1)
        //           ? <React.Fragment>Select {rootChildren.length === 1 ? 'the top-level thought' : 'one of the top-level thoughts'} ({joinConjunction(rootChildren.map(child => `"${child.key}"`), 'or')}). </React.Fragment>
        //           : null
        //         }{isMobile ? 'Trace the line below with your finger' : `Hit the Enter key`} to create a new thought.
        //     </TutorialHint>
        //   </p>
        // </React.Fragment>,

        [TUTORIAL2_STEP_CONTEXT_VIEW_SELECT]: (() => {
          const caseSensitiveValue = getContexts(tutorialContent).length > 0 ? tutorialContent : tutorialContent.toLowerCase()
          return <React.Fragment>
            <p>Now I'm going to show you the {isMobile ? 'gesture' : 'shortcut'} to view multiple contexts.</p>
            <p>First select "{caseSensitiveValue}".</p>
          </React.Fragment>
        })(),

        [TUTORIAL2_STEP_CONTEXT_VIEW_TOGGLE]: (() => {
          const caseSensitiveValue = getContexts(tutorialContent).length > 0 ? tutorialContent : tutorialContent.toLowerCase()
          return <React.Fragment>
            {!cursor || sigKey(cursor) !== caseSensitiveValue
            ? <p>First select "{caseSensitiveValue}".</p>
            : <React.Fragment>
              {isHint() ? <p>You did the right gesture, but somehow "{caseSensitiveValue}" wasn't selected. Try{!cursor || sigKey(cursor) !== caseSensitiveValue ? <React.Fragment> selecting "{caseSensitiveValue}" and trying</React.Fragment> : null} again.</p> : null}
              <p>{isMobile ? 'Trace the line below' : `Hit ${formatKeyboardShortcut(shortcutById('toggleContextView').keyboard)}`} to view the current thought's contexts.</p>
            </React.Fragment>}
          </React.Fragment>
        })(),

        [TUTORIAL2_STEP_CONTEXT_VIEW_OPEN]: (() => {
          const caseSensitiveValue = getContexts(tutorialContent).length > 0 ? tutorialContent : tutorialContent.toLowerCase()
          return <React.Fragment>
            <p>Well, look at that. We now see all of the contexts in which "{caseSensitiveValue}" appears, namely "{TUTORIAL_CONTEXT1[tutorialContent]}" and "{TUTORIAL_CONTEXT2[tutorialContent]}". You can select a context to view its subthoughts.</p>
            <p>There are no manual links in <b>em</b>. Whenever you type a thought, it is automatically linked to all of its other contexts.</p>
          </React.Fragment>
        })(),

        [TUTORIAL2_STEP_CONTEXT_VIEW_EXAMPLES]: <React.Fragment>
          <p>Here are some real-world examples of using contexts in <b>em</b>:</p>
          <ul>
            <li>View all thoughts related to a particular person no matter where their name occurs.</li>
            <li>Keep track of quotations from different sources.</li>
            <li>Create a link on the home screen to a deeply nested subthought for easy access.</li>
          </ul>
          <p>The more thoughts you add to <b>em</b>, the more useful this feature will become.</p>
        </React.Fragment>,

        [TUTORIAL2_STEP_SUCCESS]: <React.Fragment>
          <p>Congratulations! You have completed the <i>Contexts</i> tutorial.</p>
          <p>You now have the skills to create a vast web of thoughts in <b>em</b>.</p>
          <p>That's right; you're on your own now. But you can always replay this tutorial or explore all of the available {isMobile ? 'gestures' : 'keyboard shortcuts'} by clicking the <a onClick={() => dispatch({ type: 'showHelper', id: 'help' })}>Help</a> link in the footer.</p>
          <p>Happy Sensemaking!</p>
        </React.Fragment>,

      }[Math.floor(tutorialStep)] || <p>Oops! I am supposed to continue the tutorial, but I do not recognize tutorial step {tutorialStep}.</p>}
      </div>
      <div className='center'>

        <div className='tutorial-step-bullets'>{Array(tutorialStep < TUTORIAL2_STEP_START
          ? TUTORIAL_STEP_SUCCESS - TUTORIAL_STEP_START + 1
          : TUTORIAL2_STEP_SUCCESS - TUTORIAL2_STEP_START + 1
        ).fill().map((_, i) => {
          const step = i + (tutorialStep < TUTORIAL2_STEP_START ? 1 : TUTORIAL2_STEP_START)
          return <a
            className={classNames({
              'tutorial-step-bullet': true,
              active: step === Math.floor(tutorialStep)
            })}
            key={step}
            onClick={() => dispatch({ type: 'tutorialStep', value: step })}>•</a>
        }
        )}</div>

        {tutorialStep === TUTORIAL_STEP_SUCCESS
          ? <React.Fragment>
            <a className='tutorial-button button button-variable-width' onClick={() => dispatch({ type: 'tutorialStep', value: TUTORIAL2_STEP_START })}>Learn more</a>
            <a className='tutorial-button button button-variable-width' onClick={() => dispatch({ type: 'tutorialStep', value: TUTORIAL_STEP_NONE })}>Play on my own</a>
          </React.Fragment>
        : tutorialStep === TUTORIAL2_STEP_CHOOSE
          ? <ul className='simple-list'>
            <li><a className='tutorial-button button button-variable-width' onClick={() => {
              dispatch({ type: 'tutorialContentChoice', value: TUTORIAL_CONTENT_TODO })
              tutorialNext()
            }}>A to-do list</a></li>
            <li><a className='tutorial-button button button-variable-width' onClick={() => {
              dispatch({ type: 'tutorialContentChoice', value: TUTORIAL_CONTENT_JOURNAL })
              tutorialNext()
            }}>A journal theme</a></li>
            <li><a className='tutorial-button button button-variable-width' onClick={() => {
              dispatch({ type: 'tutorialContentChoice', value: TUTORIAL_CONTENT_ACADEMIC })
              tutorialNext()
            }}>An academic reference</a></li>
          </ul>
        : <React.Fragment>
            <TutorialPrev tutorialStep={tutorialStep} />
            <TutorialNext tutorialStep={tutorialStep} />
          </React.Fragment>
        }
      </div>
    </div>

    {isMobile && (
      tutorialStep === TUTORIAL_STEP_FIRSTTHOUGHT ||
      tutorialStep === TUTORIAL_STEP_SECONDTHOUGHT_HINT ||
      tutorialStep === TUTORIAL_STEP_SUBTHOUGHT ||
      tutorialStep === TUTORIAL2_STEP_CONTEXT_VIEW_TOGGLE
    )
      ? <div className='tutorial-trace-gesture'>
        <GestureDiagram path={
          tutorialStep === TUTORIAL_STEP_FIRSTTHOUGHT ||
          tutorialStep === TUTORIAL_STEP_SECONDTHOUGHT_HINT
            ? shortcutById('newThought').gesture
          : tutorialStep === TUTORIAL_STEP_SUBTHOUGHT /*||
            tutorialStep === TUTORIAL2_STEP_SUBTHOUGHT_HINT*/
            ? shortcutById('newSubthought').gesture
          : tutorialStep === TUTORIAL2_STEP_CONTEXT_VIEW_TOGGLE
            ? shortcutById('toggleContextView').gesture
          : null
          }
          size='160'
          strokeWidth='10'
          arrowSize='5'
          className='animate-pulse'
        />
      </div>
      : null
    }

  </div></div>
})

