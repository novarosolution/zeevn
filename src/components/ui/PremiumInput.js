import React, { memo } from "react";
import Input from "./Input";

/**
 * @deprecated Use `Input` from `components/ui` (or `@/components/ui`) instead.
 * This shim maps legacy PremiumInput props onto the canonical Input (including web DOM primitives).
 */
function PremiumInputBase({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  helperText,
  errorText,
  iconLeft,
  iconRight,
  onIconRightPress,
  secureTextEntry,
  multiline,
  numberOfLines,
  keyboardType,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  editable = true,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  textContentType,
  inputMode,
  testID,
  style,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  passwordToggle = false,
}) {
  return (
    <Input
      label={label}
      floatingLabel={Boolean(label)}
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      helperText={helperText}
      errorText={errorText}
      iconLeft={iconLeft}
      iconRight={iconRight}
      onIconRightPress={onIconRightPress}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      autoCorrect={autoCorrect}
      autoFocus={autoFocus}
      editable={editable}
      maxLength={maxLength}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      blurOnSubmit={blurOnSubmit}
      textContentType={textContentType}
      inputMode={inputMode}
      testID={testID}
      style={style}
      inputStyle={inputStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      passwordToggle={passwordToggle}
    />
  );
}

const PremiumInput = memo(PremiumInputBase);

export default PremiumInput;
