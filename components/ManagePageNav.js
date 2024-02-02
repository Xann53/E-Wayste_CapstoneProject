import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ManageNav({ NavFunction }) {
    const [collectors, setCollectors] = useState(true);
    const [trucks, setTrucks] = useState(false);
    const [pending, setPending] = useState(false);

    const Reset = async() => {
        setCollectors(false);
        setTrucks(false);
        setPending(false);
    }

    return (
        <>
            <View style={{display: 'flex', width: '100%', flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                <TouchableOpacity activeOpacity={1} style={{display: 'flex', borderRadius: 100, width: 100, height: 31, overflow: 'hidden', shadowColor: 'black', shadowOpacity: 1, elevation: 5}} onPress={() => {NavFunction('Collectors'); Reset(); setCollectors(true);}}>
                    <View style={{display: 'flex', flex: 1, backgroundColor: collectors ? '#E8A319' : 'rgb(220, 130, 47)', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontWeight: 800, color: 'white'}}>Collectors</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={1} style={{display: 'flex', borderRadius: 100, width: 80, height: 31, overflow: 'hidden', shadowColor: 'black', shadowOpacity: 1, elevation: 5}} onPress={() => {NavFunction('Trucks'); Reset(); setTrucks(true);}}>
                    <View style={{display: 'flex', flex: 1, backgroundColor: trucks ? '#E8A319' : 'rgb(220, 130, 47)', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontWeight: 800, color: 'white'}}>Trucks</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={1} style={{display: 'flex', borderRadius: 100, width: 90, height: 31, overflow: 'hidden', shadowColor: 'black', shadowOpacity: 1, elevation: 5}} onPress={() => {NavFunction('Pending'); Reset(); setPending(true);}}>
                    <View style={{display: 'flex', flex: 1, backgroundColor: pending ? '#E8A319' : 'rgb(220, 130, 47)', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontWeight: 800, color: 'white'}}>Pending</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </>
    );
}