import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert, Modal, FlatList, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminVetManagementScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [vets, setVets] = useState([]);
  const [showAddVet, setShowAddVet] = useState(false);
  const [showScheduleVet, setShowScheduleVet] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
  const [vetSchedules, setVetSchedules] = useState([]);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Form states for Add Vet
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Form states for Schedule
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAppointments, setMaxAppointments] = useState('');

  // Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [dateObj, setDateObj] = useState(new Date());
  const [startTimeObj, setStartTimeObj] = useState(new Date());
  const [endTimeObj, setEndTimeObj] = useState(new Date());

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateObj(selectedDate);
      setDate(selectedDate.toISOString().split('T')[0]);
      if (Platform.OS === 'android') setShowDatePicker(false);
    }
  };

  const onChangeStartTime = (event, selectedDate) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartTimeObj(selectedDate);
      setStartTime(`${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`);
      if (Platform.OS === 'android') setShowStartTimePicker(false);
    }
  };

  const onChangeEndTime = (event, selectedDate) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndTimeObj(selectedDate);
      setEndTime(`${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`);
      if (Platform.OS === 'android') setShowEndTimePicker(false);
    }
  };

  useEffect(() => {
    fetchVets();
  }, []);

  const fetchVets = async () => {
    try {
      const { data } = await api.get('/vets', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setVets(data);
    } catch (error) {
      console.error('Error fetching vets:', error);
      Alert.alert('Error', 'Could not load vets.');
    }
  };

  const handleAddVet = async () => {
    try {
      await api.post('/vets', {
        name, email, password, phone, role: 'vet'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      Alert.alert('Success', 'Vet added successfully');
      setShowAddVet(false);
      setName(''); setEmail(''); setPassword(''); setPhone('');
      fetchVets();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Could not add vet');
    }
  };

  const fetchVetSchedules = async (vid) => {
    try {
      const { data } = await api.get(`/vets/${vid}/schedule`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setVetSchedules(data);
    } catch(error) {
      console.error(error);
    }
  };

  const handleSetSchedule = async () => {
    try {
      const payload = { date, startTime, endTime, maxAppointments: Number(maxAppointments) };
      if (editingScheduleId) {
        await api.put(`/vets/${selectedVet}/schedule/${editingScheduleId}`, payload, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        Alert.alert('Success', 'Schedule updated successfully');
      } else {
        await api.post(`/vets/${selectedVet}/schedule`, payload, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        Alert.alert('Success', 'Schedule added successfully');
      }
      
      setDate(''); setStartTime(''); setEndTime(''); setMaxAppointments('');
      setEditingScheduleId(null);
      fetchVetSchedules(selectedVet);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Could not save schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await api.delete(`/vets/${selectedVet}/schedule/${id}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      fetchVetSchedules(selectedVet);
      Alert.alert('Success', 'Schedule deleted');
    } catch(e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not delete');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.greenHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.greeting}>Vet Management</Text>
            <TouchableOpacity onPress={() => setShowAddVet(true)}>
              <Text style={styles.addText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Current Vets</Text>
        {vets.map(vet => (
          <View key={vet._id} style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{vet.name}</Text>
              <Text style={styles.cardSub}>{vet.email}</Text>
              <Text style={styles.cardSub}>{vet.phone}</Text>
            </View>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => {
                setSelectedVet(vet._id);
                setEditingScheduleId(null);
                setDate(''); setStartTime(''); setEndTime(''); setMaxAppointments('');
                fetchVetSchedules(vet._id);
                setShowScheduleVet(true);
              }}
            >
              <Text style={styles.actionBtnText}>Set Schedule</Text>
            </TouchableOpacity>
          </View>
        ))}
        {vets.length === 0 && <Text style={styles.emptyText}>No vets found.</Text>}
      </ScrollView>

      {/* Add Vet Modal */}
      <Modal visible={showAddVet} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Vet</Text>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddVet(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddVet}>
                <Text style={styles.submitBtnText}>Add Vet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Schedule Modal */}
      <Modal visible={showScheduleVet} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>Manage Vet Schedules</Text>
            
            {/* Existing Schedules */}
            <View style={{maxHeight: 200, marginBottom: 16}}>
              <ScrollView>
                {vetSchedules.map(sched => (
                  <View key={sched._id} style={styles.miniCard}>
                    <View style={{flex: 1}}>
                      <Text style={{fontWeight: 'bold', color: '#333'}}>{sched.date}</Text>
                      <Text style={{fontSize: 12, color: '#666'}}>{sched.startTime} - {sched.endTime} ({sched.bookedAppointments}/{sched.maxAppointments} booked)</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                       setEditingScheduleId(sched._id);
                       setDate(sched.date); setStartTime(sched.startTime); setEndTime(sched.endTime);
                       setMaxAppointments(sched.maxAppointments.toString());
                    }} style={{marginLeft: 10}}>
                      <Text style={{color: '#5E35B1', fontWeight: 'bold'}}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSchedule(sched._id)} style={{marginLeft: 15}}>
                      <Text style={{color: '#E65100', fontWeight: 'bold'}}>Del</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {vetSchedules.length === 0 && <Text style={{color: '#999', textAlign: 'center'}}>No schedules found.</Text>}
              </ScrollView>
            </View>

            <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>{editingScheduleId ? 'Edit Schedule' : 'New Schedule'}</Text>

            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{color: date ? '#333' : '#999'}}>{date || "Date (YYYY-MM-DD)"}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateObj} mode="date" display="default"
                onChange={onChangeDate}
              />
            )}

            <TouchableOpacity style={styles.input} onPress={() => setShowStartTimePicker(true)}>
              <Text style={{color: startTime ? '#333' : '#999'}}>{startTime || "Start Time (HH:mm)"}</Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <DateTimePicker
                value={startTimeObj} mode="time" display="default"
                onChange={onChangeStartTime}
              />
            )}

            <TouchableOpacity style={styles.input} onPress={() => setShowEndTimePicker(true)}>
              <Text style={{color: endTime ? '#333' : '#999'}}>{endTime || "End Time (HH:mm)"}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker
                value={endTimeObj} mode="time" display="default"
                onChange={onChangeEndTime}
              />
            )}

            <TextInput style={styles.input} placeholder="Max Appointments" value={maxAppointments} onChangeText={setMaxAppointments} keyboardType="numeric" />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setShowScheduleVet(false);
                setEditingScheduleId(null);
                setDate(''); setStartTime(''); setEndTime(''); setMaxAppointments('');
              }}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSetSchedule}>
                <Text style={styles.submitBtnText}>{editingScheduleId ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F4F6F8' },
  greenHeader: {
    backgroundColor: '#5EBFA4',
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 35,
  },
  backButton: { width: 40 },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  addText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  container: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  card: {
    backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 4 },
  actionBtn: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  input: {
    backgroundColor: '#F4F6F8', padding: 16, borderRadius: 12, marginBottom: 16,
    fontSize: 15, color: '#333',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#F4F6F8', borderRadius: 12, marginRight: 8 },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  submitBtn: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#5EBFA4', borderRadius: 12, marginLeft: 8 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold' },
  miniCard: {
    backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE'
  }
});