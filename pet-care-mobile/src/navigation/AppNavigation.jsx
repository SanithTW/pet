import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Admin Flow
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminVetManagementScreen from '../screens/admin/AdminVetManagementScreen';
import AdminAppointmentApprovalScreen from '../screens/admin/AdminAppointmentApprovalScreen';
import AdminVaccineCatalogScreen from '../screens/admin/AdminVaccineCatalogScreen';
import AdminGroomingManagementScreen from '../screens/admin/AdminGroomingManagementScreen';
import AdminBoardingManagementScreen from '../screens/admin/AdminBoardingManagementScreen';
import AdminDietManagementScreen from '../screens/admin/AdminDietManagementScreen';
import AdminMedicationManagementScreen from '../screens/admin/AdminMedicationManagementScreen';
import AdminGroomingBookingApprovalScreen from '../screens/admin/AdminGroomingBookingApprovalScreen';
import AdminBoardingBookingApprovalScreen from '../screens/admin/AdminBoardingBookingApprovalScreen';


import TabNavigator from './TabNavigation';

// The 6 Modules
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import BookAppointmentScreen from '../screens/appointments/BookAppointmentScreen';
import VaccinationsScreen from '../screens/vaccinations/VaccinationsScreen';
import MedicationsScreen from '../screens/medications/MedicationsScreen';
import GroomingScreen from '../screens/grooming/GroomingScreen';
import DietScreen from '../screens/diet/DietScreen';
import BoardingScreen from '../screens/boarding/BoardingScreen';
import AddPetScreen from '../screens/pets/AddPetScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { userToken, userRole } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken === null ? (
          // Auth Flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OtpVerification" component={OtpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : userRole === 'admin' ? (
          // Admin Authenticated Flow
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminVetManagement" component={AdminVetManagementScreen} />
            <Stack.Screen name="AdminAppointmentApproval" component={AdminAppointmentApprovalScreen} />
            <Stack.Screen name="AdminVaccineCatalog" component={AdminVaccineCatalogScreen} />
            <Stack.Screen name="AdminGroomingManagement" component={AdminGroomingManagementScreen} />
            <Stack.Screen name="AdminBoardingManagement" component={AdminBoardingManagementScreen} />
            <Stack.Screen name="AdminDietManagement" component={AdminDietManagementScreen} />
            <Stack.Screen name="AdminMedicationManagement" component={AdminMedicationManagementScreen} />
            <Stack.Screen name="AdminBoardingBookingApproval" component={AdminBoardingBookingApprovalScreen} />
            <Stack.Screen name="AdminGroomingBookingApproval" component={AdminGroomingBookingApprovalScreen} />
          </>
        ) : (
          // Authenticated Flow
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            
            {/* Native Stack Screens (with default header) */}
            <Stack.Group screenOptions={{ headerShown: true }}>
              <Stack.Screen name="Appointments" component={AppointmentsScreen} />
            </Stack.Group>

            {/* Custom Header Screens */}
            <Stack.Screen name="AddPet" component={AddPetScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Vaccinations" component={VaccinationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Grooming" component={GroomingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Boarding" component={BoardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Diet" component={DietScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Medications" component={MedicationsScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
