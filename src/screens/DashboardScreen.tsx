import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, Platform, Modal, ScrollView 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { taskService, notificationService } from '../services/api';
import { Task, NotificationDocument } from '../types';
import { LogOut, Plus, Edit2, Trash2, CheckCircle, Bell, CheckCheck, X, Info } from 'lucide-react-native';
import mqtt from 'mqtt';

const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationDocument | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  
  const mqttClient = useRef<mqtt.MqttClient | null>(null);


  const loadNotifications = useCallback(async () => {
    if (!user?.id || authLoading) return;
    try {
      const response = await notificationService.getAll({ usuarioId: user.id, lida: false });
      const lista = response.registros || [];
      setNotifications(lista);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn("401 detectado em notificações. Tentando novamente...");
      }
      console.error("Erro ao carregar notificações:", error);
    }
  }, [user?.id, authLoading]);

  const loadTasks = useCallback(async () => {
    if (!user?.id || authLoading) return;
    try {
      const response = await taskService.getAll({ usuarioId: user.id });
      setTasks(response.registros || []);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, authLoading]);

  const handleOpenNotifications = async () => {
    if (notifLoading) return;
    try {
      setNotifLoading(true);
      await loadNotifications();
      setShowNotifModal(true);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar as notificações.");
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id || authLoading) return;

    if (!mqttClient.current) {
      mqttClient.current = mqtt.connect(`ws://192.168.0.83:9001`);
      mqttClient.current.on('connect', () => {
        console.log('MQTT: Conectado');
        mqttClient.current?.subscribe(`notificacoes/usuario/${user.id}`);
      });
    }

    const messageHandler = (topic: string) => {
      console.log('MQTT: Mensagem em', topic);
      loadNotifications();
      loadTasks();
    };

    mqttClient.current.removeAllListeners('message');
    mqttClient.current.on('message', messageHandler);

    return () => {};
  }, [user?.id, authLoading, loadNotifications, loadTasks]);

  useEffect(() => {
    if (authLoading) return;

    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks();
      loadNotifications();
    });

    loadTasks();
    loadNotifications();
    
    return unsubscribe;
  }, [navigation, authLoading, loadTasks, loadNotifications]);

  const handleMarkAsRead = async (notifId?: string) => {
    try {
      const targetNotifications = notifId 
        ? notifications.filter(n => (n as any).notification?.id === notifId)
        : notifications;

      if (targetNotifications.length === 0) return;

      const payload = targetNotifications.map(n => {
        const data = (n as any).notification;
        return {
          id: data.id,
          taskId: data.taskId,
          usuarioId: data.usuarioId,
          titulo: data.titulo,
          mensagem: data.mensagem,
          status: data.status,
          lida: true,
          dataNotificacao: data.dataNotificacao
        };
      });

      await notificationService.update(payload);
      
      await loadNotifications();
      setSelectedNotif(null);
      if (!notifId || notifications.length <= 1) {
        setShowNotifModal(false);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar.');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await taskService.update([{ ...task, status: 'CONCLUIDA' }]);
      loadTasks();
    } catch (error) { Alert.alert('Erro', 'Falha ao concluir tarefa.'); }
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Excluir', 'Deseja apagar esta atividade?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          try { await taskService.delete([task]); loadTasks(); } 
          catch (error) { Alert.alert('Erro', 'Falha ao excluir.'); }
      }}
    ]);
  };

  if (authLoading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}>Olá, {user.nome}</Text>
          <Text style={styles.subtitle}>Gerencie suas atividades</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={handleOpenNotifications}
            style={styles.notifBtn}
            disabled={notifLoading}
          >
            {notifLoading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                <Bell size={24} color="#374151" />
                {notifications.length > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{notifications.length}</Text></View>
                )}
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}><LogOut size={22} color="#EF4444" /></TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.taskTitle}>{item.titulo}</Text>
                <View style={[styles.statusBadge, item.status === 'CONCLUIDA' ? styles.statusDone : styles.statusPending]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.taskDesc} numberOfLines={1}>{item.descricao}</Text>
              <View style={styles.actionRow}>
                {item.status !== 'CONCLUIDA' && (
                  <TouchableOpacity onPress={() => handleToggleComplete(item)} style={styles.actionIcon}><CheckCircle size={20} color="#10B981" /></TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => navigation.navigate('CreateTask', { task: item })} style={styles.actionIcon}><Edit2 size={20} color="#2563EB" /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionIcon}><Trash2 size={20} color="#EF4444" /></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTasks(); loadNotifications(); }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateTask')}><Plus color="#FFF" size={28} /></TouchableOpacity>

      <Modal visible={showNotifModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>NOTIFICAÇÕES</Text>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={() => handleMarkAsRead()} style={styles.markAllBtn}>
                  <CheckCheck size={18} color="#2563EB" /><Text style={styles.markAllText}>Marcar todas</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <TouchableOpacity 
                    key={n.notification?.id} 
                    style={styles.notifItem} 
                    onPress={() => setSelectedNotif(n)}
                  >
                    <View style={styles.notifHeaderRow}>
                       <Text style={styles.notifItemTitle}>{n.notification?.titulo}</Text>
                       <View style={styles.blueDot} />
                    </View>
                    <Text style={styles.notifItemMsg} numberOfLines={1}>{n.notification?.mensagem}</Text>
                    <Text style={styles.notifItemTime}>
                        {n.notification?.dataNotificacao ? new Date(n.notification.dataNotificacao).toLocaleString() : ''}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : ( <Text style={styles.emptyNotif}>Nenhuma notificação nova.</Text> )}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowNotifModal(false)} style={styles.closeNotifBtn}><Text style={styles.closeNotifText}>Fechar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedNotif} transparent animationType="fade">
          <View style={styles.detailsOverlay}>
              <View style={styles.detailsContent}>
                  <View style={styles.detailsHeader}>
                      <View style={styles.detailsTitleContainer}><Info size={20} color="#2563EB" /><Text style={styles.detailsHeaderText}>Detalhes</Text></View>
                      <TouchableOpacity onPress={() => setSelectedNotif(null)}><X size={24} color="#9CA3AF" /></TouchableOpacity>
                  </View>
                  <View style={styles.detailsBody}>
                      <Text style={styles.detailsLabel}>TÍTULO</Text>
                      <Text style={styles.detailsValueTitle}>{(selectedNotif as any)?.notification?.titulo}</Text>
                      <View style={styles.detailsMsgBox}>
                          <Text style={styles.detailsMsgLabel}>MENSAGEM</Text>
                          <Text style={styles.detailsValueMsg}>{(selectedNotif as any)?.notification?.mensagem}</Text>
                      </View>
                      <Text style={styles.detailsDate}>📅 {(selectedNotif as any)?.notification?.dataNotificacao ? new Date((selectedNotif as any).notification.dataNotificacao).toLocaleString() : ''}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.markReadActionBtn} 
                    onPress={() => selectedNotif && handleMarkAsRead((selectedNotif as any).notification.id)}
                  >
                      <CheckCheck size={20} color="#FFF" /><Text style={styles.markReadActionText}>Marcar como Lida</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingTop: Platform.OS === 'ios' ? 50 : 25 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  welcome: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280' },
  notifBtn: { marginRight: 15, position: 'relative', padding: 5, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  logoutBtn: { padding: 5 },
  listContent: { padding: 20, paddingBottom: 100 },
  taskCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 3 },
  taskInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 10 },
  taskDesc: { fontSize: 14, color: '#6B7280', marginBottom: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusPending: { backgroundColor: '#FFEDD5' },
  statusDone: { backgroundColor: '#DCFCE7' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#9A3412' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  actionIcon: { marginLeft: 25, padding: 4 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
  fab: { position: 'absolute', right: 25, bottom: 25, backgroundColor: '#2563EB', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', paddingTop: 80 },
  notifContent: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 12, padding: 20, elevation: 5 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  notifTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center' },
  markAllText: { color: '#2563EB', marginLeft: 4, fontWeight: '600', fontSize: 13 },
  notifItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifItemTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  blueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  notifItemMsg: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  notifItemTime: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  emptyNotif: { textAlign: 'center', padding: 20, color: '#9CA3AF' },
  closeNotifBtn: { marginTop: 15, alignItems: 'center', padding: 10 },
  closeNotifText: { color: '#6B7280', fontWeight: 'bold' },
  detailsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  detailsContent: { backgroundColor: '#FFF', width: '90%', borderRadius: 16, padding: 20 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailsTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  detailsHeaderText: { fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: '#111827' },
  detailsBody: { marginBottom: 25 },
  detailsLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginBottom: 5 },
  detailsValueTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  detailsMsgBox: { backgroundColor: '#EFF6FF', padding: 15, borderRadius: 12, marginBottom: 15 },
  detailsMsgLabel: { fontSize: 10, color: '#2563EB', fontWeight: 'bold', marginBottom: 8 },
  detailsValueMsg: { fontSize: 14, color: '#374151', lineHeight: 20 },
  detailsDate: { fontSize: 13, color: '#6B7280' },
  markReadActionBtn: { backgroundColor: '#2563EB', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12 },
  markReadActionText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});

export default DashboardScreen;