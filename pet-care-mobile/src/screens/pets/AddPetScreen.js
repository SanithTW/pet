import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const AddedPetCard = ({ pet, onDelete }) => (
  <View style={styles.addedPetCard}>
    <View style={styles.petImageContainer}>
      {pet.profileImage ? (
        <Image source={{ uri: pet.profileImage }} style={styles.petImage} />
      ) : (
        <View style={styles.petImagePlaceholder}>
          <Text style={styles.petImagePlaceholderText}>No Image</Text>
        </View>
      )}
    </View>
    <View style={styles.petInfo}>
      <Text style={styles.petName}>{pet.name}</Text>
      <Text style={styles.petMeta}>{pet.species} {pet.breed ? `• ${pet.breed}` : ''}</Text>
      <Text style={styles.petMeta}>{pet.gender || 'Unknown gender'} • {pet.age ?? '-'} yrs</Text>
    </View>
    <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(pet._id)}>
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  </View>
);

export default function AddPetScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const [pets, setPets] = useState([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    fetchPets();
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ visible: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const fetchPets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pets');
      setPets(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionMethod = ImagePicker.requestMediaLibraryPermissionsAsync || ImagePicker.getMediaLibraryPermissionsAsync;
      if (!permissionMethod) {
        showToast('Image picker permission method is unavailable.', 'error');
        return;
      }

      const permissionResult = await permissionMethod();
      const granted = permissionResult?.granted || permissionResult?.status === 'granted';
      if (!granted) {
        showToast('Permission required to access photos.', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      const cancelled = result?.canceled || result?.cancelled;
      if (cancelled) {
        showToast('Image selection cancelled.', 'error');
        return;
      }

      const asset = result?.assets?.[0] || result;
      const uri = asset?.uri;
      if (uri) {
        setImageUri(uri);
      } else {
        showToast('Unable to read selected image.', 'error');
      }
    } catch (error) {
      console.error('Pick image error:', error);
      showToast('Unable to open image picker.', 'error');
    }
  };

  const handleAddPet = async () => {
    if (!name.trim() || !species.trim()) {
      showToast('Pet name and species are required.', 'error');
      return;
    }

    const data = new FormData();
    data.append('name', name.trim());
    data.append('species', species.trim());
    data.append('breed', breed.trim());
    data.append('gender', gender.trim());
    data.append('age', age.trim());
    data.append('weight', weight.trim());

    if (imageUri) {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';

      data.append('profileImage', {
        uri: imageUri,
        name: filename,
        type: type
      });
    }

    setLoading(true);
    try {
      await api.post('/pets', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userToken}`
        }
      });



      setName('');
      setSpecies('');
      setBreed('');
      setGender('');
      setAge('');
      setWeight('');
      setImageUri(null);
      fetchPets();
      showToast('Pet added successfully.', 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Network error while adding pet.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePet = (petId) => {
    Alert.alert('Delete Pet', 'Are you sure you want to delete this pet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/pets/${petId}`);
            fetchPets();
            showToast('Pet deleted successfully.', 'success');
          } catch (error) {
            showToast(error.response?.data?.message || error.message, 'error');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.greenHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Pets</Text>
            <View style={{ width: 30 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {toast.visible && (
          <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>Added Pets</Text>

        {loading && <ActivityIndicator size="large" color="#5EBFA4" style={{ marginVertical: 20 }} />}

        {!loading && pets.length === 0 && (
          <Text style={styles.emptyText}>No pets added yet. Use the form below to add your first pet.</Text>
        )}

        {pets.map((pet) => (
          <AddedPetCard key={pet._id} pet={pet} onDelete={handleDeletePet} />
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Add a New Pet</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.inputFull}
            placeholder="Pet Name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.inputFull}
            placeholder="Species"
            placeholderTextColor="#888"
            value={species}
            onChangeText={setSpecies}
          />
          <TextInput
            style={styles.inputFull}
            placeholder="Breed"
            placeholderTextColor="#888"
            value={breed}
            onChangeText={setBreed}
          />

          <View style={styles.row3}>
            <TextInput
              style={styles.input3}
              placeholder="Gender"
              placeholderTextColor="#888"
              value={gender}
              onChangeText={setGender}
            />
            <TextInput
              style={styles.input3}
              placeholder="Age"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
            <TextInput
              style={styles.input3}
              placeholder="Weight"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>{imageUri ? 'Change Pet Image' : 'Pick Pet Image'}</Text>
          </TouchableOpacity>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : null}
        </View>

        <TouchableOpacity style={styles.addPetButton} onPress={handleAddPet} disabled={loading}>
          <Text style={styles.addPetButtonText}>{loading ? 'Saving...' : 'Add Pet'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F9F9F9' },
  greenHeader: {
    backgroundColor: '#5EBFA4',
    paddingTop: 25, // For notch and status bar if outside safearea in older devices
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backButton: {
    width: 30, height: 30, justifyContent: 'center',
  },
  backArrow: { fontSize: 24, color: '#FFF' },
  headerTitle: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  container: { padding: 20, paddingBottom: 50 },
  scanContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },


  addedPetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCDCDC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  petImageContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#FFBE76',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petImage: { width: '100%', height: '100%' },
  petImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E2E2',
  },
  petImagePlaceholderText: {
    color: '#777',
    fontSize: 10,
    textAlign: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  petMeta: { fontSize: 12, color: '#555', marginTop: 2 },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputFull: {
    backgroundColor: '#DCDCDC',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    marginBottom: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  row3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  input3: {
    backgroundColor: '#DCDCDC',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    width: '31%',
    color: '#333',
    fontWeight: 'bold',
  },
  row2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  input2: {
    backgroundColor: '#DCDCDC',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    width: '48%',
    color: '#333',
    fontWeight: 'bold',
  },
  imageButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#5EBFA4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  imageButtonText: {
    color: '#5EBFA4',
    fontSize: 14,
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  toast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastSuccess: {
    backgroundColor: '#5EBFA4',
  },
  toastError: {
    backgroundColor: '#FF6B6B',
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 16,
  },

  addPetButton: {
    backgroundColor: '#5EBFA4',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  addPetButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
