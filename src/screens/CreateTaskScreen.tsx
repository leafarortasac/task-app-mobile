import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { taskService, authService } from '../services/api';
import { ChevronDown, Lock } from 'lucide-react-native';

const CreateTaskScreen: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  const { user: currentUser } = useAuth();
  const taskToEdit = route.params?.task;
  const isEditing = !!taskToEdit;

  const [titulo, setTitulo] = useState(taskToEdit?.titulo || '');
  const [descricao, setDescricao] = useState(taskToEdit?.descricao || '');
  const [status, setStatus] = useState(taskToEdit?.status || 'PENDENTE');
  
  const [atribuidoA, setAtribuidoA] = useState({ 
    id: taskToEdit?.usuarioId || currentUser?.id, 
    email: currentUser?.email || 'Selecionar...' 
  });
  
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const statusOptions = [
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
    { label: 'Concluída', value: 'CONCLUIDA' },
  ];

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await authService.getAllUsers(); 
        const listaBruta = response?.registros || [];
        setUsuarios(listaBruta);
        
        if (isEditing && listaBruta.length > 0) {
          const itemDono = listaBruta.find((item: any) => item.usuario?.id === taskToEdit.usuarioId);
          if (itemDono) {
            setAtribuidoA({ id: itemDono.usuario.id, email: itemDono.usuario.email });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleSaveTask() {
    if (!titulo.trim() || !descricao.trim()) {
      Alert.alert('Atenção', 'Título e descrição são obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      const taskData = {
        ...taskToEdit,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        status: status,
        usuarioId: atribuidoA.id,
        dataCriacao: isEditing ? taskToEdit.dataCriacao : new Date().toISOString()
      };

      if (isEditing) {
        await taskService.update([taskData]);
        Alert.alert('Sucesso', 'Tarefa atualizada!');
      } else {
        await taskService.create([taskData]);
        Alert.alert('Sucesso', 'Tarefa criada!');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar no servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.formTitle}>{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>
          
          {/* TÍTULO: Bloqueado se for edição */}
          <Text style={styles.label}>Título {isEditing && <Text style={styles.immutableLabel}>(Imutável)</Text>} *</Text>
          <View style={[styles.inputContainer, isEditing && styles.disabledInput]}>
            <TextInput 
              style={styles.flexInput} 
              value={titulo} 
              onChangeText={setTitulo} 
              editable={!isEditing}
            />
            {isEditing && <Lock size={16} color="#9CA3AF" />}
          </View>

          <Text style={styles.label}>Descrição *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline value={descricao} onChangeText={setDescricao}
            textAlignVertical="top" placeholder="Descreva os detalhes..."
          />

          {/* ATRIBUIR A: Bloqueado se for edição */}
          <Text style={styles.label}>Atribuir a {isEditing && <Text style={styles.immutableLabel}>(Imutável)</Text>} *</Text>
          <TouchableOpacity 
            style={[styles.selectButton, isEditing && styles.disabledInput]} 
            onPress={() => !isEditing && setShowUserModal(true)}
            disabled={isEditing}
          >
            <Text style={[styles.selectText, isEditing && styles.disabledText]}>{atribuidoA.email}</Text>
            {isEditing ? <Lock size={16} color="#9CA3AF" /> : <ChevronDown size={20} color="#6B7280" />}
          </TouchableOpacity>

          <Text style={styles.label}>Status *</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowStatusModal(true)}>
            <Text style={styles.selectText}>
              {statusOptions.find(opt => opt.value === status)?.label}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSaveTask} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{isEditing ? 'Atualizar' : 'Criar'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {}
      <Modal visible={showStatusModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Status</Text>
            {statusOptions.map((opt) => (
              <TouchableOpacity 
                key={opt.value} 
                style={styles.modalOption}
                onPress={() => { setStatus(opt.value); setShowStatusModal(false); }}
              >
                <Text style={styles.modalOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showUserModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Responsável</Text>
            <ScrollView style={{maxHeight: 300}}>
              {usuarios.map((item, index) => (
                <TouchableOpacity 
                  key={item.usuario?.id || `user-${index}`} 
                  style={styles.modalOption}
                  onPress={() => { 
                    setAtribuidoA({ id: item.usuario.id, email: item.usuario.email }); 
                    setShowUserModal(false); 
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.usuario?.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowUserModal(false)} style={styles.modalCloseBtn}>
              <Text style={{color: '#EF4444', fontWeight: 'bold'}}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  form: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, elevation: 2 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  immutableLabel: { color: '#F97316', fontWeight: 'normal', fontSize: 12 }, // Estilo laranja igual ao front
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, 
    borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, marginBottom: 20 
  },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  flexInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1F2937' },
  disabledInput: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  disabledText: { color: '#9CA3AF' },
  textArea: { height: 100 },
  selectButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 20 },
  selectText: { fontSize: 16, color: '#1F2937' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, flex: 1, marginLeft: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 8, flex: 1, alignItems: 'center' },
  cancelButtonText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionText: { fontSize: 16, textAlign: 'center', color: '#374151' },
  modalCloseBtn: { marginTop: 15, alignItems: 'center', padding: 10 }
});

export default CreateTaskScreen;