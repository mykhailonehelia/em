import React from 'react'
import Svg, { G, Path } from 'react-native-svg'
import IconType from '../@types/Icon'
import Shortcut from '../@types/Shortcut'
import setAttribute from '../action-creators/setAttribute'
import toggleAttribute from '../action-creators/toggleAttribute'
import { HOME_PATH } from '../constants'
import attribute from '../selectors/attribute'
import attributeEquals from '../selectors/attributeEquals'
import findDescendant from '../selectors/findDescendant'
import simplifyPath from '../selectors/simplifyPath'
import appendToPath from '../util/appendToPath'
import head from '../util/head'

// eslint-disable-next-line jsdoc/require-jsdoc
const Icon = ({ size = 20, fill }: IconType) => (
  <Svg fill={fill} width={size} height={size} viewBox='0 0 23 20'>
    <G translate={[-514, -140]}>
      <G>
        <Path d='M525,154.95V166h1v-11.05c1.694-0.245,3-1.688,3-3.45c0-1.933-1.566-3.5-3.5-3.5s-3.5,1.567-3.5,3.5    C522,153.261,523.306,154.705,525,154.95z M523,151.5c0-1.381,1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5s-1.119,2.5-2.5,2.5    S523,152.881,523,151.5z' />
        <Path d='M533,159h1v-11.05c1.694-0.245,3-1.688,3-3.45c0-1.933-1.566-3.5-3.5-3.5s-3.5,1.567-3.5,3.5c0,1.761,1.306,3.205,3,3.45    V159z M531,144.5c0-1.381,1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5s-1.119,2.5-2.5,2.5S531,145.881,531,144.5z' />
        <Path d='M517,160h1v-11.05c0.354-0.051,0.688-0.151,1-0.299c1.18-0.563,2-1.757,2-3.15c0-1.933-1.566-3.5-3.5-3.5    s-3.5,1.567-3.5,3.5c0,1.394,0.82,2.587,2,3.15c0.312,0.148,0.646,0.248,1,0.299V160z M515,145.5c0-1.381,1.119-2.5,2.5-2.5    s2.5,1.119,2.5,2.5s-1.119,2.5-2.5,2.5S515,146.881,515,145.5z' />
      </G>
    </G>
  </Svg>
)

const pinSubthoughtsShortcut: Shortcut = {
  id: 'pinSubthoughts',
  label: 'Pin Open Subthoughts',
  description: "Pin open the current thought's subthoughts.",
  // keyboard: { key: 'p', meta: true, shift: true },
  svg: Icon,
  exec: (dispatch, getState) => {
    const state = getState()
    const { cursor } = state
    if (!cursor) return

    const simplePath = simplifyPath(state, cursor)

    const childrenAttributeId = findDescendant(getState(), head(simplePath), '=children')
    const value = attribute(getState(), childrenAttributeId, '=pin')

    dispatch([
      // if =children/=pin/true, toggle =children off
      // if =children/=pin/false, do nothing
      // otherwise toggle =children on
      ...(value !== 'false'
        ? [
            toggleAttribute({
              path: simplePath,
              key: '=children',
              value: '=pin',
            }),
          ]
        : []),
      // assume that =children exists
      (dispatch, getState) => {
        const childrenAttributeIdNew = findDescendant(getState(), head(simplePath), '=children')
        dispatch(
          setAttribute({
            path: appendToPath(simplePath, childrenAttributeIdNew!),
            key: '=pin',
            value: 'true',
          }),
        )
      },
    ])
  },
  isActive: getState => {
    const state = getState()
    const { cursor } = state
    const path = cursor ? simplifyPath(state, cursor) : HOME_PATH
    return findDescendant(state, head(path), ['=children', '=pin', 'true'])
  },
}

export default pinSubthoughtsShortcut
