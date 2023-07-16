import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Newsfeed from './tab/homePage';
import Report from './tab/reportPage';
import Map from './tab/mapPage';
import Schedule from './tab/schedPage';
import Notifications from './tab/notifPage';

const Tab = createBottomTabNavigator();

export default function UserLayout() {
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
            <Tab.Screen name='home' component={Newsfeed} options={{headerShown: false}} />
            <Tab.Screen name='report' component={Report} options={{ headerShown: false }} />
            <Tab.Screen name='map' component={Map} options={{ headerShown: false }} />
            <Tab.Screen name='schedule' component={Schedule} options={{ headerShown: false }} />
            <Tab.Screen name='notification' component={Notifications} options={{ headerShown: false }} />
        </Tab.Navigator>
    );
}