import * as React from 'react';
import { fetchUserId } from '../components/userService';
import CommentOverlay from '../components/commentOverlay';
import { StyleSheet, View, Text, TextInput, Modal, Share, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import { parse } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';
import moment from 'moment';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, getDoc, query, where, deleteDoc, doc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';

import SideBar from '../components/SideNav';

export default function Newsfeed({ navigation }) {
    return (
        <>
            <View style={{display: 'flex', flex: 1, flexDirection: 'row', height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center'}}>
                <Button title='home' onPress={() => {navigation.navigate('home')}} />
                <Button title='report' onPress={() => {navigation.navigate('report')}} />
                <Button title='map' onPress={() => {navigation.navigate('map')}} />
                <Button title='profile' onPress={() => {navigation.navigate('profile')}} />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
     container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingBottom: 60,
        paddingTop: 20,
    },
    contentGap: {
        marginBottom: 10,
    },
    contentButton: {
        width: 330,
        backgroundColor: 'rgb(230, 230, 230)',
        borderRadius: 5,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 3,
            height: 3,
        },
        shadowOpacity: 1,
        shadowRadius: 1,
        elevation: 5,
    },
    contentButtonFront: {
        width: '100%',
        backgroundColor: 'rgb(247, 245, 243)',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'rgba(113, 112, 108, 1)',
    },
    containerPfp: {
        width: 35,
        height: 35,
        backgroundColor: '#D6D6D8',
        borderRadius: 55,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderPfp: {
        fontSize: 25,
        color: 'green',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
      
    },
    modalTitleInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 10,
        padding: 10,
    },
    modalTextInput: {
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 10,
        padding: 10,
    },
    modalButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 2,
    },
    modalChooseButton: {
        backgroundColor: '#FFCB3C',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    modalCloseButton: {
        backgroundColor: 'lightgray',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 5,
    },
});