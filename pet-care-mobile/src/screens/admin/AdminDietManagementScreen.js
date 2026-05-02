import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import api, { apiBaseUrl } from '../../services/api';

export default function AdminDietManagementScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [dietRecords, setDietRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);

  // Diet fields
  const [categoryName, setCategoryName] = useState('');
  const [morningMeal, setMorningMeal] = useState('');
  const [afternoonMeal, setAfternoonMeal] = useState('');
  const [eveningMeal, setEveningMeal] = useState('');
  const [portionSize, setPortionSize] = useState('');
  const [feedingFrequency, setFeedingFrequency] = useState('');
  const [waterIntake, setWaterIntake] = useState('');
  const [allergies, setAllergies] = useState('');
  const [avoidFoods, setAvoidFoods] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [vetInstructions, setVetInstructions] = useState('');
  const [dietChartUri, setDietChartUri] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };
  const baseFileUrl = apiBaseUrl.replace('/api', '');

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
      const { data } = await api.get('/diet/records/admin/all', authHeader);
      setDietRecords(data);
    } catch (e) { console.error(e); }
  };

  const resetFields = () => {
    setCategoryName(''); setMorningMeal(''); setAfternoonMeal(''); setEveningMeal('');
    setPortionSize(''); setFeedingFrequency(''); setWaterIntake('');
    setAllergies(''); setAvoidFoods(''); setSpecialNotes(''); setVetInstructions('');
    setDietChartUri(null);
  };

  const openAdd = (app) => {
    setEditingId(null); setSelectedAppId(app._id); resetFields();
    setShowModal(true);
  };

  const openEdit = (record) => {
    setEditingId(record._id);
    setSelectedAppId(record.appointment?._id || record.appointment);
    setCategoryName(record.categoryName || '');
    setSpecialNotes(record.specialNotes || '');
    setVetInstructions(record.vetInstructions || '');
    setAllergies(record.allergies || '');
    setAvoidFoods(record.avoidFoods || '');
    setPortionSize(record.portionSize || '');
    setFeedingFrequency(record.feedingFrequency || '');
    setWaterIntake(record.waterIntake || '');
    const s = record.schedule || [];
    setMorningMeal(s.find(x => x.time === 'Morning')?.portion || '');
    setAfternoonMeal(s.find(x => x.time === 'Afternoon')?.portion || '');
    setEveningMeal(s.find(x => x.time === 'Evening')?.portion || '');
    setDietChartUri(record.dietChartUrl ? `${baseFileUrl}${record.dietChartUrl}` : null);
    setShowModal(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setDietChartUri(result.assets[0].uri);
  };

  const buildSchedule = () => {
    const schedule = [];
    if (morningMeal.trim()) schedule.push({ time: 'Morning', portion: morningMeal.trim() });
    if (afternoonMeal.trim()) schedule.push({ time: 'Afternoon', portion: afternoonMeal.trim() });
    if (eveningMeal.trim()) schedule.push({ time: 'Evening', portion: eveningMeal.trim() });
    if (schedule.length === 0) schedule.push({ time: 'Morning', portion: portionSize || '1 cup' });
    return schedule;
  };

  const handleSave = async () => {
    if (!categoryName.trim()) return Alert.alert('Error', 'Food category/name is required');
    const formData = new FormData();
    formData.append('categoryName', categoryName);
    formData.append('startDate', new Date().toISOString());
    formData.append('schedule', JSON.stringify(buildSchedule()));
    formData.append('specialNotes', specialNotes);
    formData.append('vetInstructions', vetInstructions);
    formData.append('allergies', allergies);
    formData.append('avoidFoods', avoidFoods);
    formData.append('portionSize', portionSize);
    formData.append('feedingFrequency', feedingFrequency);
    formData.append('waterIntake', waterIntake);

    if (dietChartUri && !dietChartUri.startsWith('http')) {
      const ext = dietChartUri.split('.').pop().split('?')[0] || 'jpg';
      formData.append('dietChart', { uri: dietChartUri, name: `diet.${ext}`, type: `image/${ext}` });
    }

    try {
      if (editingId) {
        await api.put(`/diet/records/admin/${editingId}`, formData, authHeader);
      } else {
        await api.post(`/appointments/${selectedAppId}/diet`, formData, authHeader);
      }
      setShowModal(false); fetchRecords(); Alert.alert('Success', 'Diet plan saved');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this record?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/diet/records/${id}`, authHeader); fetchRecords();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backArrow}>{'<'}</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>Diet Management</Text>
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
                  <Text style={styles.planBtnText}>+ Add Plan</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary History</Text>
            {dietRecords.length === 0 && <Text style={styles.emptyText}>No records found.</Text>}
            {dietRecords.map(record => (
              <View key={record._id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={{flex:1}}>
                    <Text style={styles.recordPetName}>{record.pet?.name || 'Unknown'} <Text style={styles.recordCatName}>({record.categoryName})</Text></Text>
                    <Text style={styles.recordInfo}>Started: {new Date(record.startDate).toLocaleDateString()}</Text>
                    {record.specialNotes ? <Text style={styles.recordNotes}>Notes: {record.specialNotes}</Text> : null}
                    {record.allergies ? <Text style={styles.recordAllergy}>Allergies: {record.allergies}</Text> : null}
                  </View>
                  <View style={[styles.statusBadge, record.isActive ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusText}>{record.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
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
              <Text style={styles.modalTitle}>{editingId ? 'Edit Diet Plan' : 'Add Diet Plan'}</Text>

              {/* Category */}
              <Text style={styles.label}>Food Category / Diet Type: <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="e.g. Puppy Dry Food, Raw Diet, Prescription Diet" value={categoryName} onChangeText={setCategoryName} />

              {/* Meal Schedule */}
              <Text style={styles.sectionLabel}>Meal Schedule</Text>
              <View style={styles.mealRow}>
                <View style={styles.mealBox}>
                  <Text style={styles.mealLabel}>Morning</Text>
                  <TextInput style={styles.mealInput} placeholder="e.g. 1 cup dry" value={morningMeal} onChangeText={setMorningMeal} />
                </View>
                <View style={styles.mealBox}>
                  <Text style={styles.mealLabel}>Afternoon</Text>
                  <TextInput style={styles.mealInput} placeholder="e.g. half cup" value={afternoonMeal} onChangeText={setAfternoonMeal} />
                </View>
                <View style={styles.mealBox}>
                  <Text style={styles.mealLabel}>Evening</Text>
                  <TextInput style={styles.mealInput} placeholder="e.g. 1 cup wet" value={eveningMeal} onChangeText={setEveningMeal} />
                </View>
              </View>

              {/* Feeding Details */}
              <Text style={styles.sectionLabel}>Feeding Details</Text>
              <View style={{flexDirection: 'row', gap: 8}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Portion Size:</Text>
                  <TextInput style={styles.input} placeholder="e.g. 200g, 2 cups" value={portionSize} onChangeText={setPortionSize} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Feeding Frequency:</Text>
                  <TextInput style={styles.input} placeholder="e.g. 3x per day" value={feedingFrequency} onChangeText={setFeedingFrequency} />
                </View>
              </View>

              <Text style={styles.label}>Daily Water Intake:</Text>
              <TextInput style={styles.input} placeholder="e.g. 500ml per day, unlimited fresh water" value={waterIntake} onChangeText={setWaterIntake} />

              {/* Restrictions */}
              <Text style={styles.sectionLabel}>Dietary Restrictions</Text>
              <Text style={styles.label}>Known Allergies / Intolerances:</Text>
              <TextInput style={styles.input} placeholder="e.g. Chicken, Dairy, Wheat" value={allergies} onChangeText={setAllergies} />

              <Text style={styles.label}>Foods to Avoid:</Text>
              <TextInput style={[styles.input, {minHeight: 60}]} placeholder="e.g. No grapes, chocolate, onions..." value={avoidFoods} onChangeText={setAvoidFoods} multiline />

              {/* Notes */}
              <Text style={styles.sectionLabel}>Notes & Instructions</Text>
              <Text style={styles.label}>Vet Instructions:</Text>
              <TextInput style={[styles.input, {minHeight: 70}]} placeholder="e.g. Feed at regular intervals, monitor weight weekly..." value={vetInstructions} onChangeText={setVetInstructions} multiline />

              <Text style={styles.label}>Special Notes:</Text>
              <TextInput style={[styles.input, {minHeight: 70}]} placeholder="e.g. Pet prefers wet food, add digestive supplements..." value={specialNotes} onChangeText={setSpecialNotes} multiline />

              {/* Upload */}
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Text style={styles.uploadText}>{dietChartUri ? 'Diet Chart Uploaded' : 'Upload Diet Chart'}</Text>
              </TouchableOpacity>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save Plan</Text></TouchableOpacity>
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
  appCard: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#FF9800' },
  appPetName: { fontSize: 16, fontWeight: 'bold', color: '#E65100' },
  appSubText: { fontSize: 12, color: '#F57C00' },
  planBtn: { backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  planBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  recordCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 12, elevation: 2 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  recordPetName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  recordCatName: { color: '#666', fontWeight: 'normal' },
  recordInfo: { fontSize: 12, color: '#888', marginTop: 2 },
  recordNotes: { fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic' },
  recordAllergy: { fontSize: 11, color: '#E65100', marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#E8F5E9' },
  statusInactive: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  recordActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10, marginTop: 5 },
  editText: { color: '#5EBFA4', fontWeight: 'bold', fontSize: 12 },
  deleteText: { color: '#FF5252', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#444', marginTop: 10, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5 },
  required: { color: '#FF5252' },
  input: { backgroundColor: '#F0F2F5', borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 14 },
  mealRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  mealBox: { flex: 1 },
  mealLabel: { fontSize: 11, fontWeight: 'bold', color: '#666', marginBottom: 4, textAlign: 'center' },
  mealInput: { backgroundColor: '#F0F2F5', borderRadius: 10, padding: 10, fontSize: 12, textAlign: 'center' },
  uploadBtn: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20, marginTop: 5 },
  uploadText: { color: '#2E7D32', fontWeight: 'bold' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 10 },
  saveBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#5EBFA4', borderRadius: 10 },
});