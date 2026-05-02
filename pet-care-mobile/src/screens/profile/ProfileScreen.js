import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { logout, userName, userEmail } = useContext(AuthContext);

  return (
    <View style={styles.mainContainer}>
      {/* Green Header */}
      <View style={styles.greenHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.avatarContainer}>
              <Image style={styles.avatar} source={require('../../../assets/1.png')} />
            </View>
          </View>
        </SafeAreaView>
      </View>



      {/* Overlapping White Info Card */}
      <View style={styles.infoCardWrapper}>
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.nameText}>{userName || '—'}</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={logout}>
              <Text style={styles.signOutIcon}>{'<-'}</Text>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>✉</Text>
            <Text style={styles.contactText}>{userEmail || '—'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF' },
  greenHeader: {
    backgroundColor: '#5EBFA4',
    paddingTop: 35, 
    paddingBottom: 10,
    zIndex: 10, // keep header above images if needed
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backButton: {
    width: 40, height: 40, justifyContent: 'center',
  },
  backArrow: { fontSize: 24, color: '#FFF' },
  headerTitle: { fontSize: 20, color: '#FFF', fontWeight: 'bold' },
  avatarContainer: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  
  imageContainer: {
    width: '100%',
    height: 350, // large height for the image
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  
  infoCardWrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA', // light background for empty space
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    marginHorizontal: 15,
    marginTop: 0, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    borderRadius: 30, // all corners rounded slightly? The mockup has bottom rounded too. Let's make it a floating card.
    paddingBottom: 40,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutIcon: {
    color: '#FF3B30',
    fontSize: 18,
    marginRight: 6,
    fontWeight: 'bold',
  },
  signOutText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  contactIcon: {
    fontSize: 20,
    color: '#333',
    marginRight: 16,
    width: 30,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  }
});
