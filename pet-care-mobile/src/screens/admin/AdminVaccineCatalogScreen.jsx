import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminVaccineCatalogScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vaccines/catalog/admin', authHeader);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.message || 'Could not load vaccines');
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const openNew = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setSortOrder('0');
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setName(item.name || '');
    setDescription(item.description || '');
    setIsActive(Boolean(item.isActive));
    setSortOrder(String(item.sortOrder ?? 0));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
  };

  const saveItem = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        isActive,
        sortOrder: Number(sortOrder) || 0,
      };
      if (editingId) {
        await api.put(`/vaccines/catalog/admin/${editingId}`, payload, authHeader);
        Alert.alert('Success', 'Vaccine updated');
      } else {
        await api.post('/vaccines/catalog/admin', payload, authHeader);
        Alert.alert('Success', 'Vaccine added');
      }
      closeModal();
      fetchCatalog();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed');
    }
  };

  const deleteItem = (item) => {
    Alert.alert(
      'Delete vaccine',
      `Remove "${item.name}" from the list? Owners can no longer select it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vaccines/catalog/admin/${item._id}`, authHeader);
              Alert.alert('Success', 'Removed');
              fetchCatalog();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Vaccine list</Text>
            <TouchableOpacity onPress={openNew}>
              <Text style={styles.add}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#5EBFA4" size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.length === 0 && (
            <Text style={styles.empty}>No vaccines yet. Add types owners can choose from.</Text>
          )}
          {items.map((v) => (
            <View key={v._id} style={[styles.card, !v.isActive && styles.cardInactive]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{v.name}</Text>
                {!!v.description && <Text style={styles.desc}>{v.description}</Text>}
                <Text style={styles.meta}>
                  {!v.isActive ? 'Inactive' : 'Active'} · order {v.sortOrder ?? 0}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(v)}>
                  <Text style={styles.edit}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteItem(v)}>
                  <Text style={styles.del}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit vaccine' : 'New vaccine'}</Text>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput
              style={[styles.input, { minHeight: 72 }]}
              placeholder="Short description (optional)"
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Sort order (number)"
              keyboardType="number-pad"
              value={sortOrder}
              onChangeText={setSortOrder}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Active (visible to pet owners)</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: '#5EBFA4' }} />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancel} onPress={closeModal}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.save} onPress={saveItem}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { backgroundColor: '#5EBFA4', height: 110, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
  },
  back: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  add: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  list: { padding: 16, paddingBottom: 80 },
  empty: { textAlign: 'center', color: '#888', marginTop: 28 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 2,
  },
  cardInactive: { opacity: 0.75 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  desc: { fontSize: 13, color: '#666', marginTop: 6 },
  meta: { fontSize: 11, color: '#999', marginTop: 6 },
  actions: { justifyContent: 'center', paddingLeft: 8, gap: 12 },
  edit: { color: '#5EBFA4', fontWeight: 'bold', fontSize: 14 },
  del: { color: '#FF5252', fontWeight: 'bold', fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 },
  input: {
    backgroundColor: '#F0F2F5',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: { fontSize: 14, color: '#555', flex: 1 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancel: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F0F2F5',
  },
  save: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#5EBFA4',
  },
});
