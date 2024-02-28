import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import NewsfeedAut from '../app/homePageA';
import Manage from '../app/managePage';
import ReportAut from '../app/reportPageA';
import MapAut from '../app/mapPageAut';
import SchedLayout from './schedRouteAut';
import MessageLayout from './messageRoute';
import Notifications from '../app/notifPage';
import Profile from '../app/profilePage';

const Tab = createBottomTabNavigator();

export default function AuthorityLayout() {
    return (
        <Tab.Navigator
            initialRouteName='home'
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let rn = route.name;
                    if (rn === 'home') {
                        iconName = focused ? 'home' : 'home-outline'
                    }
                    if (rn === 'manage') {
                        iconName = focused ? 'list' : 'list-outline'
                    }
                    if (rn === 'report') {
                        iconName = focused ? 'file-tray-stacked' : 'file-tray-stacked-outline'
                    }
                    if (rn === 'map') {
                        iconName = focused ? 'map' : 'map-outline'
                    }
                    if (rn === 'schedule') {
                        iconName = focused ? 'calendar' : 'calendar-outline'
                    }
                    if (rn === 'notification') {
                        iconName = focused ? 'notifications' : 'notifications-outline'
                    }
                    if (rn === 'message') {
                        iconName = focused ? 'chatbox-ellipses' : 'chatbox-ellipses-outline'
                    }

                    return <Ionicons name={iconName} size={size} color={color} />
                },
                tabBarStyle: {
                    position: 'absolute',
                    height: 60,
                    backgroundColor: 'rgb(179,229,94)',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderTopWidth: -5,
                    overflow: 'hidden'
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    top: 35,
                    position: 'absolute',
                },
                tabBarIconStyle: {
                    top: -6,
                },
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: 'rgb(81,175,91)',
                tabBarActiveBackgroundColor: 'rgba(126, 185, 73, 1)',
            })}
        >
            <Tab.Screen name='home' component={NewsfeedAut} options={{headerShown: false}} />
            <Tab.Screen name='manage' component={Manage} options={{headerShown: false}} />
            <Tab.Screen name='report' component={ReportAut} options={{ headerShown: false }} />
            <Tab.Screen name='map' component={MapAut} options={{ headerShown: false }} />
            <Tab.Screen name='schedule' component={SchedLayout} options={{ headerShown: false }} />
            <Tab.Screen name='message' component={MessageLayout} options={{ headerShown: false }} />
            <Tab.Screen name='notification' component={Notifications} options={{ headerShown: false, tabBarItemStyle: { display: 'none' }, tabBarStyle: { display: 'none' } }} />
            <Tab.Screen name='profile' component={Profile} options={{ headerShown: false, tabBarItemStyle: { display: 'none' }, tabBarStyle: { display: 'none' }  }} />
        </Tab.Navigator>
    );
}