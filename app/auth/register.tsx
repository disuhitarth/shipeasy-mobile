import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/store/auth';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuth((s) => s.register);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register(name, email, password);
      router.back();
    } catch (e) {
      // show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#0B0B12" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.sub}>Start shipping with ShipEasy Canada</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Alex Morgan"
              placeholderTextColor="#9A9AA4"
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9A9AA4"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor="#9A9AA4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F5' },
  header: { padding: 16, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, marginTop: 20 },
  sub: { fontSize: 15, color: '#6B6B76', marginTop: 6 },
  form: { gap: 16, marginTop: 28 },
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B6B76', paddingLeft: 2 },
  input: { height: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(10,10,20,0.07)', backgroundColor: '#fff', paddingHorizontal: 15, fontSize: 16, color: '#0B0B12' },
  submitBtn: { height: 52, borderRadius: 14, backgroundColor: '#635BFF', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchText: { textAlign: 'center', color: '#6B6B76', fontSize: 14, marginTop: 24 },
  switchLink: { color: '#635BFF', fontWeight: '600' },
});
