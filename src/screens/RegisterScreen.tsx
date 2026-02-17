import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert, Modal 
} from 'react-native';
import { authService } from '../services/api';
import { Role } from '../types';
import { ChevronDown, Eye, EyeOff } from 'lucide-react-native';

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState(''); 
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [role, setRole] = useState<Role>(Role.USER);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const roleOptions = [
    { label: 'Administrador', value: Role.ADMIN },
    { label: 'Usuário', value: Role.USER },
  ];

  async function handleRegister() {
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem!');
      return;
    }

    try {
      setLoading(true);
      await authService.register({ 
        nome: nome.trim(), email: email.trim(), senha: senha.trim(), role 
      });
      Alert.alert('Sucesso', 'Conta criada!', [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
    } catch (error: any) {
      Alert.alert('Erro', 'Falha no servidor. Verifique se o e-mail já existe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.title}>Cadastrar Novo Usuário</Text>
          <Text style={styles.subtitle}>Crie sua conta no Gerenciador de Tarefas</Text>

          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput style={styles.input} placeholder="Digite seu nome" value={nome} onChangeText={setNome} />

          <Text style={styles.label}>E-mail *</Text>
          <TextInput style={styles.input} placeholder="usuario@exemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Tipo de Perfil *</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowRoleModal(true)}>
            <Text style={styles.selectButtonText}>{roleOptions.find(opt => opt.value === role)?.label}</Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.label}>Senha *</Text>
          <View style={styles.passwordContainer}>
            <TextInput style={styles.inputPassword} placeholder="Digite uma senha" secureTextEntry={!showSenha} value={senha} onChangeText={setSenha} />
            <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={styles.eyeIcon}>
              {showSenha ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar Senha *</Text>
          <View style={styles.passwordContainer}>
            <TextInput style={styles.inputPassword} placeholder="Repita sua senha" secureTextEntry={!showConfirmarSenha} value={confirmarSenha} onChangeText={setConfirmarSenha} />
            <TouchableOpacity onPress={() => setShowConfirmarSenha(!showConfirmarSenha)} style={styles.eyeIcon}>
              {showConfirmarSenha ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Já tem uma conta? Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showRoleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Perfil</Text>
            {roleOptions.map((opt) => (
              <TouchableOpacity key={opt.value} style={styles.modalOption} onPress={() => { setRole(opt.value); setShowRoleModal(false); }}>
                <Text style={styles.modalOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowRoleModal(false)} style={styles.modalClose}>
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  form: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2563EB', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, marginBottom: 15 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginBottom: 15 },
  inputPassword: { flex: 1, padding: 10 },
  eyeIcon: { padding: 10 },
  selectButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, marginBottom: 15 },
  selectButtonText: { fontSize: 16 },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backButtonText: { color: '#2563EB' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionText: { textAlign: 'center' },
  modalClose: { marginTop: 15, alignItems: 'center' }
});

export default RegisterScreen;