import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Picker, TextInput } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function BookAppointmentScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchVets();
    fetchPets();
  }, []);

  const fetchVets = async () => {
    try {
      const { data } = await api.get('/vets', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setVets(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPets = async () => {
    try {
      const { data } = await api.get('/pets', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setPets(data);
      if (data.length > 0) {
        setSelectedPet(data[0]._id);
      }
    } catch(err){
      console.error('Error fetching pets:', err);
    }
  };

  const handleVetSelect = async (vetId) => {
    setSelectedVet(vetId);
    setSelectedSchedule(null);
    try {
      const { data } = await api.get(`/vets/${vetId}/schedule`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setSchedules(data);
    } catch(err) {
      console.error(err);
    }
  };

  const handleBook = async () => {
    if (!selectedVet || !selectedSchedule || !reason || !selectedPet) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    // find schedule details
    const schedInfo = schedules.find(s => s._id === selectedSchedule);

    if (!schedInfo) return;

    try {
      await api.post('/appointments', {
        pet: selectedPet,
        vet: selectedVet,
        schedule: selectedSchedule,
        date: schedInfo.date,
        time: schedInfo.startTime,
        reason
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      Alert.alert('Success', 'Appointment booked successfully. Waiting for Admin approval.');
      navigation.goBack();
    } catch (error) {
       console.error(error);
       Alert.alert('Error', error.response?.data?.message || 'Failed to book');
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
            <Text style={styles.greeting}>Book Appointment</Text>
            <View style={{ width: 40 }}/>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Select Your Pet</Text>
        <View style={styles.vetGrid}>
          {pets.map(pet => (
            <TouchableOpacity 
              key={pet._id} 
              style={[styles.vetCard, selectedPet === pet._id && styles.vetCardSelected]}
              onPress={() => setSelectedPet(pet._id)}
            >
              <Text style={[styles.vetName, selectedPet === pet._id && styles.textSelected]}>{pet.name}</Text>
            </TouchableOpacity>
          ))}
          {pets.length === 0 && (
            <Text style={styles.errorText}>No pets found. Please add a pet in your profile first.</Text>
          )}
        </View>

        <Text style={styles.label}>Select a Vet</Text>
        <View style={styles.vetGrid}>
          {vets.map(vet => (
            <TouchableOpacity 
              key={vet._id} 
              style={[styles.vetCard, selectedVet === vet._id && styles.vetCardSelected]}
              onPress={() => handleVetSelect(vet._id)}
            >
              <Text style={[styles.vetName, selectedVet === vet._id && styles.textSelected]}>{vet.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedVet && schedules.length > 0 && (
          <>
            <Text style={styles.label}>Select Date & Time</Text>
            {schedules.map(sched => {
               const isFull = sched.bookedAppointments >= sched.maxAppointments;
               return (
                <TouchableOpacity 
                  key={sched._id}
                  disabled={isFull}
                  style={[
                    styles.scheduleCard, 
                    selectedSchedule === sched._id && styles.scheduleCardSelected,
                    isFull && styles.scheduleCardFull
                  ]}
                  onPress={() => setSelectedSchedule(sched._id)}
                >
                  <Text style={[styles.schedText, selectedSchedule === sched._id && styles.textSelected]}>
                    {sched.date} | {sched.startTime} - {sched.endTime}
                  </Text>
                  {isFull && <Text style={styles.fullText}>Full</Text>}
                </TouchableOpacity>
               );
            })}
          </>
        )}

        {selectedVet && schedules.length === 0 && (
          <Text style={styles.errorText}>This vet has no available schedules.</Text>
        )}

        <Text style={styles.label}>Reason for Visit</Text>
        <TextInput 
          style={styles.input}
          placeholder="e.g. Annual checkup, Vaccination..."
          value={reason}
          onChangeText={setReason}
          multiline
        />

        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <Text style={styles.bookButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </ScrollView>
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
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  backButton: { width: 40 },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  
  container: { padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  
  vetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vetCard: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    marginBottom: 10, flex: 1, minWidth: '45%', alignItems: 'center'
  },
  vetCardSelected: { borderColor: '#5EBFA4', backgroundColor: '#E8F5E9' },
  vetName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  textSelected: { color: '#4CAF50' },

  scheduleCard: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  scheduleCardSelected: { borderColor: '#5EBFA4', backgroundColor: '#E8F5E9' },
  scheduleCardFull: { backgroundColor: '#F5F5F5', opacity: 0.6 },
  schedText: { fontSize: 15, color: '#333' },
  fullText: { color: '#F44336', fontWeight: 'bold' },
  
  errorText: { color: '#F44336', marginTop: 10 },

  input: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, minHeight: 100, textAlignVertical: 'top',
    fontSize: 15, color: '#333',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  bookButton: {
    backgroundColor: '#5EBFA4', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  bookButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});