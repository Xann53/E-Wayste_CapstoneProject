import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ManageNav({ navData, NavFunction }) {
    return (
        <>
            <View style={{display: 'flex', width: '100%', flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                <TouchableOpacity activeOpacity={1} style={{display: 'flex', borderRadius: 100, width: 100, height: 31, overflow: 'hidden', shadowColor: 'black', shadowOpacity: 1, elevation: 5}} onPress={() => {NavFunction('Collectors')}}>
                    <View style={{display: 'flex', flex: 1, backgroundColor: navData === 'Collectors' ? '#E8A319' : 'rgb(220, 130, 47)', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontWeight: 800, color: 'white'}}>Collectors</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={1} style={{display: 'flex', borderRadius: 100, width: 80, height: 31, overflow: 'hidden', shadowColor: 'black', shadowOpacity: 1, elevation: 5}} onPress={() => {NavFunction('Trucks')}}>
                    <View style={{display: 'flex', flex: 1, backgroundColor: navData === 'Trucks' ? '#E8A319' : 'rgb(220, 130, 47)', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontWeight: 800, color: 'white'}}>Trucks</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={1} style={{display: 'flex', borderRadius: 100, width: 90, height: 31, overflow: 'hidden', shadowColor: 'black', shadowOpacity: 1, elevation: 5}} onPress={() => {NavFunction('Pending')}}>
                    <View style={{display: 'flex', flex: 1, backgroundColor: navData === 'Pending' ? '#E8A319' : 'rgb(220, 130, 47)', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontWeight: 800, color: 'white'}}>Pending</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </>
    );
}