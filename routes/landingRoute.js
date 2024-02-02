import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Landing from '../app/landingTabs/landingPage';
import SignUp from '../app/landingTabs/signUpPage';
import Registration1 from '../app/landingTabs/userRegisterPage';
import Registration2 from '../app/landingTabs/collectorRegisterPage';
import Registration3 from '../app/landingTabs/authorityRegisterPage';
import Login from '../app/landingTabs/loginPage';

const Tab = createBottomTabNavigator();

export default function LandingLayout() {
    return (
        <Tab.Navigator initialRouteName='landing'>
            <Tab.Screen name='landing' component={Landing} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='register' component={SignUp} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='registerUser' component={Registration1} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='registerCollector' component={Registration2} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='registerAuthority' component={Registration3} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='login' component={Login} options={{ headerShown: false, tabBarStyle: { display: 'none' } }} />
        </Tab.Navigator>
    );
}