import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Feather } from '@expo/vector-icons';

export default function OtpScreen({ route, navigation }) {
  const { login } = useContext(AuthContext);
  const { name, email, password } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds

  useEffect(() => {
    // 2 min Countdown Timer logic
    if (timeLeft === 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password, otp });
      login(response.data.token, response.data.role, response.data.name, response.data.email);
      Alert.alert(
        'Success',
        'Email verified and account registered successfully!',
        [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }) }]
      );
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Verification failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
      setTimeLeft(120); // Reset timer to 2 minutes
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to resend OTP';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timeLeft to mm:ss
  const formatTime = () => {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Right Decorative Shapes */}
      <View style={styles.shapeDark} />
      <View style={styles.shapeTeal} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.imageContainer}>
          <Image
             source={require('../../../assets/1.png')} 
             style={styles.logo}
             resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to
          {'\n'}<Text style={{ fontWeight: 'bold', color: '#5EBFA4' }}>{email}</Text>
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Feather name="shield" size={20} color="#A0A0A0" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#A0A0A0"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={isLoading || timeLeft === 0}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {timeLeft > 0 ? (
              <Text style={styles.resendText}>
                Code expires in <Text style={styles.timerText}>{formatTime()}</Text>
              </Text>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.resendText, { color: '#E53935' }]}>Code expired!</Text>
                <TouchableOpacity onPress={handleResend} style={{ marginTop: 8 }}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

      </KeyboardAvoidingView>
      <View style={styles.bottomBar} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  shapeDark: {
    position: 'absolute',
    top: -50,
    right: 30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4A4C4F',
    zIndex: 0,
  },
  shapeTeal: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#5EBFA4',
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    zIndex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D3D3D3',
    marginBottom: 30,
    height: 48,
    paddingBottom: 5,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    letterSpacing: 2,
    textAlign: 'center'
  },
  primaryButton: {
    backgroundColor: '#5EBFA4',
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    fontSize: 15,
    color: '#666',
  },
  timerText: {
    fontWeight: 'bold',
    color: '#5EBFA4',
  },
  resendLink: {
    color: '#5EBFA4',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#5EBFA4',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  }
});
