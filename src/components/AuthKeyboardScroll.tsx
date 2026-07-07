import { type ReactNode } from 'react'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

type Props = {
  children: ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
}

/** Scroll container that keeps focused inputs above the keyboard (Expo Go + native). */
export function AuthKeyboardScroll({ children, contentContainerStyle }: Props) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={48}
      extraKeyboardSpace={32}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentContainerStyle]}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
  },
})
