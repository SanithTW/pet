import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const AdminCard = ({ title, iconName, iconType: Icon, onPress, color = '#5EBFA4' }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.iconContainer}>
      <Icon name={iconName} size={36} color={color} />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.checkText}>+ Add New</Text>
  </TouchableOpacity>
);

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [totalMembers, setTotalMembers] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showRefresh = false) => {
    if (!showRefresh) setStatsLoading(true);
    try {
      const response = await api.get('/admin/stats');
      setTotalMembers(response.data.totalMembers || 0);
    } catch (error) {
      console.error('Fetch Stats Error:', error.response?.data || error.message);
      if (!showRefresh) {
        Alert.alert('Unable to load members count', error.response?.data?.message || error.message);
      }
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats(true);
  };

  const handleAction = (item) => {
    if (item === 'Vet') {
      navigation.navigate('AdminVetManagement');
    } else if (item === 'Appointments') {
      navigation.navigate('AdminAppointmentApproval');
    } else if (item === 'Vaccine') {
      navigation.navigate('AdminVaccineCatalog');
    } else if (item === 'Grooming') {
      navigation.navigate('AdminGroomingManagement');
    } else if (item === 'Boarding') {
      navigation.navigate('AdminBoardingManagement');
    } else if (item === 'BoardingApprovals') {
      navigation.navigate('AdminBoardingBookingApproval');
    } else if (item === 'GroomingApprovals') {
      navigation.navigate('AdminGroomingBookingApproval');
    } else if (item === 'Diet') {
      navigation.navigate('AdminDietManagement');
    } else if (item === 'Medication') {
      navigation.navigate('AdminMedicationManagement');
    } else {
      Alert.alert(`Add ${item}`, `This will open the form to add a new ${item} to the database.`);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.greenHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <TouchableOpacity onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5EBFA4']} />
        }
      >

        {/* Members Status Card overlapping green header matching HomeScreen */}
        <View style={styles.membersCard}>
          <Text style={styles.sectionTitle}>👥 Total Members</Text>
          <Text style={styles.membersCount}>{statsLoading ? '...' : totalMembers}</Text>
          <Text style={styles.membersSub}>Active users on the platform</Text>
        </View>

        {/* Manage Categories Grid matching HomeScreen grid style */}
        <Text style={styles.manageTitle}>Manage Network</Text>
        <View style={styles.grid}>
          <AdminCard title="Vets" iconName="user-md" iconType={FontAwesome5} onPress={() => handleAction('Vet')} />
          <AdminCard title="Appointments" iconName="calendar-alt" iconType={FontAwesome5} onPress={() => handleAction('Appointments')} />
          <AdminCard title="Vaccines" iconName="syringe" iconType={FontAwesome5} onPress={() => handleAction('Vaccine')} />
          <AdminCard title="Medication" iconName="pills" iconType={FontAwesome5} onPress={() => handleAction('Medication')} />
          <AdminCard title="Diet & Food" iconName="bone" iconType={FontAwesome5} onPress={() => handleAction('Diet')} />
          <AdminCard title="Grooming" iconName="cut" iconType={FontAwesome5} onPress={() => handleAction('Grooming')} />
          <AdminCard title="Grooming Approvals" iconName="clipboard-check" iconType={FontAwesome5} onPress={() => handleAction('GroomingApprovals')} />
          <AdminCard title="Boarding" iconName="home" iconType={FontAwesome5} onPress={() => handleAction('Boarding')} />
          <AdminCard title="Boarding Approvals" iconName="bed" iconType={FontAwesome5} onPress={() => handleAction('BoardingApprovals')} />
        </View>

      </ScrollView>
    </View>
  );
}

// Reusing HomeScreen aesthetic principles
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F4F6F8' },
  greenHeader: {
    backgroundColor: '#5EBFA4', // Green from mockup
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 35, 
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  logoutText: { fontSize: 14, fontWeight: 'bold', color: '#1A1A2E' }, // Contrast text
  container: { paddingHorizontal: 20, paddingBottom: 60 },
  
  membersCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 30,
    marginTop: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, marginBottom: 30,
    alignItems: 'center'
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 10 },
  membersCount: { fontSize: 48, fontWeight: '900', color: '#5EBFA4', marginBottom: 4 },
  membersSub: { fontSize: 14, color: '#999' },

  manageTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', backgroundColor: '#FFF', paddingVertical: 20, paddingHorizontal: 12,
    borderRadius: 24, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    alignItems: 'center', justifyContent: 'space-between'
  },
  iconContainer: { height: 60, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 36 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8, textAlign: 'center' },
  checkText: { fontSize: 12, color: '#5EBFA4', fontWeight: 'bold' }
});
