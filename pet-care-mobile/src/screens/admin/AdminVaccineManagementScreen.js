import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import api, { apiBaseUrl } from '../../services/api';

export default function AdminVaccineManagementScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [vaccineRecords, setVaccineRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Record Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [vaccineName, setVaccineName] = useState('');
  const [recordStatus, setRecordStatus] = useState('Scheduled');
  const [notes, setNotes] = useState('');
  const [documentUri, setDocumentUri] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };
  const baseFileUrl = apiBaseUrl.replace('/api', '');

  useEffect(() => { 
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchAppointments(), fetchVaccineRecords()]);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments', authHeader);
      setAppointments(data.filter(app => app.status === 'Completed'));
    } catch (error) { console.error(error); }
  };

  const fetchVaccineRecords = async () => {
    try {
      const { data } = await api.get('/vaccines/records/admin/all', authHeader);
      setVaccineRecords(data);
    } catch (error) { console.error(error); }
  };

  // --- RECORD HANDLERS ---
  const openAddRecord = (app) => {
    setEditingRecordId(null);
    setSelectedAppId(app._id);
    setVaccineName('');
    setRecordStatus('Scheduled');
    setNotes('');
    setDocumentUri(null);
    setShowRecordModal(true);
  };

  const openEditRecord = (record) => {
    setEditingRecordId(record._id);
    setSelectedAppId(record.appointment?._id || record.appointment);
    setVaccineName(record.vaccineName);
    setRecordStatus(record.status);
    setNotes(record.notes || '');
    setDocumentUri(record.documentUrl ? (record.documentUrl.startsWith('data:') ? record.documentUrl : `${baseFileUrl}${record.documentUrl}`) : null);
    setShowRecordModal(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setDocumentUri(result.assets[0].uri);
  };

  const handleSaveRecord = async () => {
    if (!vaccineName.trim()) return Alert.alert('Error', 'Vaccine name is required');
    
    const formData = new FormData();
    formData.append('vaccineName', vaccineName);
    formData.append('status', recordStatus);
    formData.append('notes', notes);
    if (recordStatus === 'Completed') {
      formData.append('dateAdministered', new Date().toISOString());
    }
    
    if (documentUri && !documentUri.startsWith('http')) {
      const ext = documentUri.split('.').pop();
      formData.append('document', { uri: documentUri, name: `vac.${ext}`, type: `image/${ext}` });
    }

    try {
      if (editingRecordId) {
        await api.put(`/vaccines/records/admin/${editingRecordId}`, formData, authHeader);
      } else {
        await api.post(`/appointments/${selectedAppId}/vaccine`, formData, authHeader);
      }
      setShowRecordModal(false);
      fetchVaccineRecords();
      Alert.alert('Success', 'Record saved!');
    } catch (error) { 
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Could not save record'); 
    }
  };

  const handleDeleteRecord = (id) => {
    Alert.alert('Delete', 'Delete this vaccine record?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/vaccines/records/${id}`, authHeader);
          fetchVaccineRecords();
        } catch (e) { Alert.alert('Error', 'Delete failed'); }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backArrow}>{'<'}</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>Vaccine Management</Text>
            <View style={{width: 40}} />
          </View>
        </SafeAreaView>
      </View>

      {loading ? <ActivityIndicator size="large" color="#5EBFA4" style={{marginTop: 50}} /> : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* QUEUE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Appointments</Text>
            {appointments.length === 0 && <Text style={styles.emptyText}>No pending appointments found.</Text>}
            {appointments.map(app => (
              <View key={app._id} style={styles.appCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appPetName}>{app.pet?.name || 'Unknown Pet'}</Text>
                  <Text style={styles.appSubText}>{new Date(app.date).toLocaleDateString()} - {app.reason}</Text>
                </View>
                <TouchableOpacity style={styles.planBtn} onPress={() => openAddRecord(app)}>
                  <Text style={styles.planBtnText}>+ Add Vaccine</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* HISTORY */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vaccination History & Plans</Text>
            {vaccineRecords.length === 0 && <Text style={styles.emptyText}>No records found.</Text>}
            {vaccineRecords.map(record => (
              <View key={record._id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={{flex: 1}}>
                    <Text style={styles.recordPetName}>{record.pet?.name} <Text style={styles.recordVacName}>({record.vaccineName})</Text></Text>
                    <Text style={styles.recordDate}>
                      {record.status === 'Completed' ? `Administered: ${new Date(record.dateAdministered).toLocaleDateString()}` : 'Status: Scheduled'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, record.status === 'Completed' ? styles.statusCompleted : styles.statusScheduled]}>
                    <Text style={styles.statusText}>{record.status}</Text>
                  </View>
                </View>
                <View style={styles.recordActions}>
                  <TouchableOpacity onPress={() => openEditRecord(record)}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteRecord(record._id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* RECORD MODAL */}
      <Modal visible={showRecordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingRecordId ? 'Edit Vaccine Record' : 'Add Vaccination'}</Text>
            
            <Text style={styles.label}>Vaccine Name:</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Rabies, DHPP" 
              value={vaccineName} 
              onChangeText={setVaccineName} 
            />

            <Text style={styles.label}>Status:</Text>
            <View style={styles.statusToggle}>
              <TouchableOpacity style={[styles.toggleBtn, recordStatus === 'Scheduled' && styles.toggleActive]} onPress={() => setRecordStatus('Scheduled')}><Text style={recordStatus === 'Scheduled' && {color: '#FFF'}}>Scheduled</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, recordStatus === 'Completed' && styles.toggleActive]} onPress={() => setRecordStatus('Completed')}><Text style={recordStatus === 'Completed' && {color: '#FFF'}}>Completed</Text></TouchableOpacity>
            </View>

            <Text style={styles.label}>Notes:</Text>
            <TextInput style={[styles.input, {minHeight: 80}]} placeholder="Optional notes" value={notes} onChangeText={setNotes} multiline />
            
            {recordStatus === 'Completed' && (
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Text style={styles.uploadText}>{documentUri ? '✅ Certificate Selected' : '📄 Upload Certificate'}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRecordModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRecord}><Text style={{ color: '#FFF' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { backgroundColor: '#5EBFA4', height: 110, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingHorizontal: 20, paddingTop: 35 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  appCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#2196F3' },
  appPetName: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
  appSubText: { fontSize: 12, color: '#1E88E5' },
  planBtn: { backgroundColor: '#2196F3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  planBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  recordCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 12, elevation: 2 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  recordPetName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  recordVacName: { color: '#666', fontWeight: 'normal' },
  recordDate: { fontSize: 11, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusScheduled: { backgroundColor: '#FFF3E0' },
  statusCompleted: { backgroundColor: '#E8F5E9' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  recordActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
  editText: { color: '#5EBFA4', fontWeight: 'bold', fontSize: 12 },
  deleteText: { color: '#FF5252', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  statusToggle: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  toggleBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#F0F2F5' },
  toggleActive: { backgroundColor: '#5EBFA4' },
  input: { backgroundColor: '#F0F2F5', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 14 },
  uploadBtn: { backgroundColor: '#E1F5FE', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  uploadText: { color: '#0288D1', fontWeight: 'bold' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 10 },
  saveBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#5EBFA4', borderRadius: 10 },
  emptyText: { textAlign: 'center', color: '#999', marginVertical: 20 }
});
