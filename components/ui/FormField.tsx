import { forwardRef, type ReactNode, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '@/lib/theme';

export interface FormFieldProps extends Omit<TextInputProps, 'style' | 'onChange' | 'value' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  required?: boolean;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  inputRef?: Ref<TextInput | null>;
  containerStyle?: any;
  multiline?: boolean;
}

export const FormField = forwardRef<TextInput | null, FormFieldProps>(function FormField(
  { label, value, onChangeText, error, required, hint, leftIcon, inputRef, containerStyle, multiline, ...rest },
  ref,
) {
  const showError = !!error;
  return (
    <View style={containerStyle}>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}
      </Text>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMulti,
          showError && styles.inputWrapError,
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={showError ? colors.red : colors.faint} style={styles.leftIcon} />
        ) : null}
        <TextInput
          ref={ref || inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.faint}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMulti, leftIcon ? styles.inputWithIcon : null]}
          {...rest}
        />
        {showError ? (
          <Ionicons name="alert-circle" size={16} color={colors.red} style={styles.errorIcon} />
        ) : null}
      </View>
      {showError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    height: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  inputWrapMulti: {
    minHeight: 88,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  inputWrapError: {
    borderColor: colors.red,
    backgroundColor: '#FFF7F7',
  },
  leftIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  inputWithIcon: { marginLeft: 0 },
  inputMulti: { textAlignVertical: 'top', minHeight: 70, paddingTop: spacing.xs },
  errorIcon: { marginLeft: spacing.sm },
  errorText: {
    fontSize: 12.5,
    color: colors.red,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: colors.faint,
    marginTop: spacing.xs,
  },
});
