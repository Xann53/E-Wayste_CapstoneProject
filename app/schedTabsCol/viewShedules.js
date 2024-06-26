import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../../firebase_config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function ViewSchedDetailsCol({ navigation, route }) {
  const { scheduleId } = route.params;
  const [scheduleData, setScheduleData] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
        const scheduleRef = doc(db, 'schedule', scheduleId);
        const unsubscribe = onSnapshot(scheduleRef, (doc) => {
            if (doc.exists()) {
                const scheduleData = doc.data();
                setScheduleData(scheduleData);
                setUpdatedData(scheduleData);
            } else {
                setScheduleData(null);
                setUpdatedData({});
            }
        });
        return () => unsubscribe();
    };

    fetchSchedule();
  }, [scheduleId]);


  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'schedule', scheduleId), updatedData);
      alert('Schedule successfully updated!');
      setIsEditable(false);
    } catch (error) {
      console.log('Error updating schedule:', error);
    }
  };

  return (
    <>
      <View style={{ position: "absolute", height: "100%", width: "100%", justifyContent: "flex-start", alignItems: "center", zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.85)" }}>
        <View style={{ position: "absolute", width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", top: 30, paddingHorizontal: 20, zIndex: 10 }}>
          <TouchableOpacity onPress={() => { navigation.navigate('mainSched'); }}>
            <Ionicons name="arrow-back" style={{ fontSize: 40, color: "rgb(179, 229, 94)" }} />
          </TouchableOpacity>
        </View>
        <View style={{ width: "100%", height: "100%", backgroundColor: "#ffffff" }}>
          <ScrollView style={{ width: "100%" }} contentContainerStyle={{ alignItems: 'flex-start', paddingTop: 90, }}>
            <Text style={{ marginBottom: 5, fontSize: 25, fontWeight: 'bold', color: '#0D5601', width: '100%', paddingLeft: 25 }}>SCHEDULE DETAILS</Text>
            {scheduleData && (
              <>
                {scheduleData.type && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Type</Text>
                    <TextInput
                      style={[styles.fieldValue, focusedField === 'type' && styles.focusedField]}
                      value={updatedData.type}
                      editable={isEditable}
                      onFocus={() => handleFieldFocus('type')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, type: text })}
                    />
                  </View>
                )}
                {scheduleData.title && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Title</Text>
                    <TextInput
                      style={[
                        styles.fieldValue,
                        focusedField === 'title' && styles.focusedField,
                        { height: Math.max(35, updatedData.title ? 35 + updatedData.title.length / 2 : 35) } // Adjust height based on text length
                      ]}
                      value={updatedData.title}
                      editable={isEditable}
                      multiline={true} // Set multiline to true
                      onFocus={() => handleFieldFocus('title')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, title: text })}
                    />
                  </View>
                )}
                {scheduleData.description && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Description</Text>
                    <TextInput
                      style={[
                        styles.fieldValue,
                        focusedField === 'description' && styles.focusedField,
                        { height: Math.max(35, updatedData.description ? 35 + updatedData.description.length / 2 : 35) } // Adjust height based on text length
                      ]}
                      value={updatedData.description}
                      editable={isEditable}
                      multiline={true} // Set multiline to true
                      onFocus={() => handleFieldFocus('title')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, description: text })}
                    />
                  </View>
                )}
                {scheduleData.assignedTruck && (
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldName}>Assigned Truck</Text>
                        <TextInput
                          style={[styles.fieldValue, focusedField === 'assignedTruck' && styles.focusedField]}
                          value={updatedData.assignedTruck}
                          onFocus={() => setModalVisible(true)}
                          editable={isEditable}
                          onBlur={handleFieldBlur}
                          onChangeText={(text) => setUpdatedData({ ...updatedData, assignedTruck: text })}
                        />
                      </View>
                  )}
                {scheduleData.location && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Location</Text>
                    <TextInput
                      style={[
                        styles.fieldValue,
                        focusedField === 'location' && styles.focusedField,
                        { height: Math.max(35, updatedData.location ? 35 + updatedData.location.length / 2 : 35) } // Adjust height based on text length
                      ]}
                      value={updatedData.location}
                      multiline={true} 
                      editable={isEditable}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, location: text })}
                    />
                  </View>
                )}
                {scheduleData.type && scheduleData.type === 'Collection' && (
                    <ScrollView style={styles.scrollContainer}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldName}>Collection Route</Text>
                            {scheduleData.collectionRoute.coordinates.map((coordinate, index) => (
                                <Text key={index} style={styles.container}>
                                    <Ionicons name="location" size={20} color="red" style={{ marginRight: 5 }} />
                                    {coordinate.locationName}
                                </Text>
                            ))}
                        </View>
                    </ScrollView>
                )}
                {scheduleData.selectedDate && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Date</Text>
                    <TextInput
                      style={[styles.fieldValue, focusedField === 'selectedDate' && styles.focusedField]}
                      value={updatedData.selectedDate}
                      editable={isEditable}
                      onFocus={() => handleFieldFocus('selectedDate')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, selectedDate: text })}
                    />
                  </View>
                )}
                <View style={[styles.fieldContainer, { marginBottom: 80 }]}>
                  <Text style={styles.fieldName}>Time</Text>
                  <TextInput
                    style={[styles.fieldValue, focusedField === 'startTime' && styles.focusedField]}
                    value={updatedData.startTime}
                    editable={isEditable}
                    onFocus={() => handleFieldFocus('startTime')}
                    onBlur={handleFieldBlur}
                    onChangeText={(text) => setUpdatedData({ ...updatedData, startTime: text })}
                  />
                </View>
                {scheduleData.assignLocation && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Assigned Location</Text>
                    <TextInput
                      style={[styles.fieldValue, focusedField === 'assignLocation' && styles.focusedField]}
                      value={updatedData.assignLocation}
                      editable={isEditable}
                      onFocus={() => handleFieldFocus('assignLocation')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, assignLocation: text })}
                    />
                  </View>
                )}
                {isEditable && (
                  <TouchableOpacity onPress={handleUpdate} style={styles.updateButton}>
                    <Text style={styles.updateButtonText}>Update</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    paddingHorizontal: 25,
    marginTop: 10,
    flexDirection: 'column',
  },
  fieldName: {
    fontWeight: 'bold',
    marginRight: -30,
    width: 150,
    fontSize: 16,
  },
  fieldValue: {
    backgroundColor: 'rgb(231,247,233)',
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgb(215,233,217)',
    color: 'rgba(45, 105, 35, 1)',
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 16,
    marginTop: 5,
    width: 310,
    height: 35,
  },
  container: {
    backgroundColor: 'rgb(231,247,233)',
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgb(215,233,217)',
    color: 'rgba(45, 105, 35, 1)',
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 16,
    marginTop: 5,
    width: 310,
    minHeight: 25,
  },
});