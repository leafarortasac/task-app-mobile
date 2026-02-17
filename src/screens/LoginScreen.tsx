import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  Modal, SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Eye, EyeOff } from 'lucide-react-native';
import { Role } from '../types';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();

  async function handleLogin() {
    const emailTrim = email.trim();
    const senhaTrim = senha.trim();

    if (emailTrim === '' || senhaTrim === '') {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha para acessar.');
      return;
    }

    try {
      setLoading(true);
      await signIn({ email: emailTrim, senha: senhaTrim });
    } catch (error: any) {
      console.error("Erro no login:", error);
      const msg = error.response?.status === 401 
        ? 'E-mail ou senha incorretos.' 
        : 'Não foi possível conectar ao servidor.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>TaskApp</Text>
          <Text style={styles.subtitle}>Gerenciador de Tarefas</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="usuario@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Sua senha"
              secureTextEntry={!showPassword}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Acessar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.switchButtonText}>
              Não tem conta? Criar nova conta
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  headerContainer: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2563EB', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 5 },
  form: { 
    backgroundColor: '#FFF', padding: 20, borderRadius: 16, 
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, 
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 } 
  },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginBottom: 20 },
  inputPassword: { flex: 1, padding: 12, fontSize: 16 },
  eyeIcon: { padding: 10 },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchButtonText: { color: '#2563EB', fontWeight: '600' }
});

export default LoginScreen;