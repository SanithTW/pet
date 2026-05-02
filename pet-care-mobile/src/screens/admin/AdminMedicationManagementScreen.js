import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import api, { getBackendOrigin } from '../../services/api';

const emptyMed = () => ({ medicationName: '', dosage: '', frequency: '' });

export default function AdminMedicationManagementScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [medRecords, setMedRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);

  // Multi-medication list (used for Add)
  const [medications, setMedications] = useState([emptyMed()]);

  // Single record edit fields
  const [editMedName, setEditMedName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionUri, setPrescriptionUri] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };
  const baseFileUrl = getBackendOrigin();

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchAppointments(), fetchRecords()]);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments', authHeader);
      setAppointments(data.filter(app => app.status === 'Completed'));
    } catch (e) { console.error(e); }
  };

  const fetchRecords = async () => {
    try {
      const { data } = await api.get('/medications/records/admin/all', authHeader);
      setMedRecords(data);
    } catch (e) { console.error(e); }
  };

  const openAdd = (app) => {
    setEditingId(null);
    setSelectedAppId(app._id);
    setMedications([emptyMed()]);
    setNotes('');
    setPrescriptionUri(null);
    setShowModal(true);
  };

  const openEdit = (record) => {
    setEditingId(record._id);
    setSelectedAppId(record.appointment?._id || record.appointment);
    setEditMedName(record.medicationName);
    setEditDosage(record.dosage);
    setEditFrequency(record.frequency);
    setNotes(record.notes || '');
    setPrescriptionUri(record.prescriptionFileUrl ? (record.prescriptionFileUrl.startsWith('data:') ? record.prescriptionFileUrl : `${baseFileUrl}${record.prescriptionFileUrl}`) : null);
    setShowModal(true);
  };

  const updateMed = (index, field, value) => {
    setMedications(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const addMedRow = () => setMedications(prev => [...prev, emptyMed()]);

  const removeMedRow = (index) => {
    if (medications.length === 1) return;
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setPrescriptionUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (editingId) {
      // Edit single record
      if (!editMedName || !editDosage || !editFrequency) return Alert.alert('Error', 'Medication name, dosage and frequency required');
      const formData = new FormData();
      formData.append('medicationName', editMedName);
      formData.append('dosage', editDosage);
      formData.append('frequency', editFrequency);
      formData.append('notes', notes);
      if (prescriptionUri && !prescriptionUri.startsWith('http')) {
        const ext = prescriptionUri.split('.').pop().split('?')[0] || 'jpg';
        formData.append('prescription', { uri: prescriptionUri, name: `rx.${ext}`, type: `image/${ext}` });
      }
      try {
        await api.put(`/medications/records/admin/${editingId}`, formData, authHeader);
        setShowModal(false); fetchRecords(); Alert.alert('Success', 'Record updated');
      } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Save failed'); }
    } else {
      // Add: submit one record per medication row
      const valid = medications.filter(m => m.medicationName.trim() && m.dosage.trim() && m.frequency.trim());
      if (valid.length === 0) return Alert.alert('Error', 'At least one medication with name, dosage, and frequency required');

      try {
        const uploads = valid.map(async (med, idx) => {
          const formData = new FormData();
          formData.append('medicationName', med.medicationName);
          formData.append('dosage', med.dosage);
          formData.append('frequency', med.frequency);
          formData.append('notes', notes);
          formData.append('startDate', new Date().toISOString());
          if (idx === 0 && prescriptionUri && !prescriptionUri.startsWith('http')) {
            const ext = prescriptionUri.split('.').pop().split('?')[0] || 'jpg';
            formData.append('prescription', { uri: prescriptionUri, name: `rx.${ext}`, type: `image/${ext}` });
          }
          return api.post(`/appointments/${selectedAppId}/medication`, formData, authHeader);
        });
        await Promise.all(uploads);
        setShowModal(false); fetchRecords();
        Alert.alert('Success', `${valid.length} medication(s) saved`);
      } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Save failed'); }
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this record?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await api.delete(`/medications/records/${id}`, authHeader); fetchRecords();
        }}
    ]);
  };

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backArrow}>{'<'}</Text></TouchableOpacity>
              <Text style={styles.headerTitle}>Medication Management</Text>
              <View style={{width: 40}} />
            </View>
          </SafeAreaView>
        </View>

        {loading ? <ActivityIndicator size="large" color="#5EBFA4" style={{marginTop: 50}} /> : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed Appointments</Text>
                {appointments.length === 0 && <Text style={styles.emptyText}>No pending appointments.</Text>}
                {appointments.map(app => (
                    <View key={app._id} style={styles.appCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.appPetName}>{app.pet?.name || 'Unknown Pet'}</Text>
                        <Text style={styles.appSubText}>{new Date(app.date).toLocaleDateString()} - {app.reason}</Text>
                      </View>
                      <TouchableOpacity style={styles.planBtn} onPress={() => openAdd(app)}>
                        <Text style={styles.planBtnText}>+ Add Meds</Text>
                      </TouchableOpacity>
                    </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medication History</Text>
                {medRecords.length === 0 && <Text style={styles.emptyText}>No records found.</Text>}
                {medRecords.map(record => (
                    <View key={record._id} style={styles.recordCard}>
                      <View style={styles.recordHeader}>
                        <View style={{flex: 1}}>
                          <Text style={styles.recordPetName}>{record.pet?.name || 'Unknown'} <Text style={styles.recordMedName}>({record.medicationName})</Text></Text>
                          <Text style={styles.recordInfo}>{record.dosage} · {record.frequency}</Text>
                          {record.notes ? <Text style={styles.recordNotes}>📝 {record.notes}</Text> : null}
                        </View>
                        <View style={styles.statusBadge}><Text style={styles.statusText}>{record.status || 'Active'}</Text></View>
                      </View>
                      <View style={styles.recordActions}>
                        <TouchableOpacity onPress={() => openEdit(record)}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(record._id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                      </View>
                    </View>
                ))}
              </View>
            </ScrollView>
        )}

        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Medication' : 'Add Medications'}</Text>

                {editingId ? (
                    // Edit mode — single row
                    <>
                      <Text style={styles.label}>Medication Name:</Text>
                      <TextInput style={styles.input} placeholder="e.g. Amoxicillin" value={editMedName} onChangeText={setEditMedName} />
                      <View style={{flexDirection: 'row', gap: 10}}>
                        <View style={{flex: 1}}>
                          <Text style={styles.label}>Dosage:</Text>
                          <TextInput style={styles.input} placeholder="e.g. 5mg" value={editDosage} onChangeText={setEditDosage} />
                        </View>
                        <View style={{flex: 1}}>
                          <Text style={styles.label}>Frequency:</Text>
                          <TextInput style={styles.input} placeholder="e.g. 2x daily" value={editFrequency} onChangeText={setEditFrequency} />
                        </View>
                      </View>
                    </>
                ) : (
                    // Add mode — multiple medication rows
                    <>
                      <View style={styles.medListHeader}>
                        <Text style={styles.label}>Medications:</Text>
                        <TouchableOpacity style={styles.addRowBtn} onPress={addMedRow}>
                          <Text style={styles.addRowBtnText}>+ Add Another</Text>
                        </TouchableOpacity>
                      </View>

                      {medications.map((med, idx) => (
                          <View key={idx} style={styles.medRow}>
                            <View style={styles.medRowHeader}>
                              <Text style={styles.medRowTitle}>Medication {idx + 1}</Text>
                              {medications.length > 1 && (
                                  <TouchableOpacity onPress={() => removeMedRow(idx)}>
                                    <Text style={styles.removeText}>✕ Remove</Text>
                                  </TouchableOpacity>
                              )}
                            </View>
                            <TextInput style={styles.input} placeholder="Medication name e.g. Amoxicillin" value={med.medicationName} onChangeText={v => updateMed(idx, 'medicationName', v)} />
                            <View style={{flexDirection: 'row', gap: 8}}>
                              <TextInput style={[styles.input, {flex: 1}]} placeholder="Dosage e.g. 5mg" value={med.dosage} onChangeText={v => updateMed(idx, 'dosage', v)} />
                              <TextInput style={[styles.input, {flex: 1}]} placeholder="Frequency" value={med.frequency} onChangeText={v => updateMed(idx, 'frequency', v)} />
                            </View>
                          </View>
                      ))}
                    </>
                )}

                <Text style={styles.label}>General Notes:</Text>
                <TextInput style={[styles.input, {minHeight: 70}]} placeholder="e.g. Give after meals, avoid sunlight..." value={notes} onChangeText={setNotes} multiline />

                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadText}>{prescriptionUri ? '✅ Prescription Uploaded' : '📄 Upload Prescription'}</Text>
                </TouchableOpacity>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{ color: '#FFF' }}>Save</Text></TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#5EBFA4', height: 110, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingHorizontal: 20, paddingTop: 35 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  appCard: { backgroundColor: '#E1F5FE', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#0288D1' },
  appPetName: { fontSize: 16, fontWeight: 'bold', color: '#01579B' },
  appSubText: { fontSize: 12, color: '#0288D1' },
  planBtn: { backgroundColor: '#0288D1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  planBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  recordCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 12, elevation: 2 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  recordPetName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  recordMedName: { color: '#666', fontWeight: 'normal' },
  recordInfo: { fontSize: 12, color: '#888', marginTop: 2 },
  recordNotes: { fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic' },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#2E7D32' },
  recordActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10, marginTop: 5 },
  editText: { color: '#5EBFA4', fontWeight: 'bold', fontSize: 12 },
  deleteText: { color: '#FF5252', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5 },
  medListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addRowBtn: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addRowBtnText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },
  medRow: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  medRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  medRowTitle: { fontSize: 13, fontWeight: 'bold', color: '#444' },
  removeText: { color: '#FF5252', fontSize: 12, fontWeight: 'bold' },
  input: { backgroundColor: '#F0F2F5', borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 14 },
  uploadBtn: { backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  uploadText: { color: '#1976D2', fontWeight: 'bold' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 10 },
  saveBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#5EBFA4', borderRadius: 10 },
});