import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.imageContainer}>
          <Image
            source={require('../../../assets/1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Hey! Welcome</Text>
          <Text style={styles.subtitle}>
            While You Sit And Stay - We'll{'\n'}Go Out And Play
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>GET STARTED ❯</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ADE4DF', // Light mint/teal background
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 300,
    height: 300,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#5B2C38', // Dark brownish color for logo text
    marginTop: -10,
    letterSpacing: 2,
    fontFamily: 'sans-serif-condensed',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#5EBFA4', // Green pill button
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    marginBottom: 50,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },

});
