import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../../../firebase_config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import DatePicker from 'react-native-datepicker';

export default function ViewSchedDetails({ navigation, route }) {
  const { scheduleId } = route.params;
  const [scheduleData, setScheduleData] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      const scheduleRef = doc(db, 'schedule', scheduleId);
      const scheduleSnapshot = await getDoc(scheduleRef);
      const scheduleData = scheduleSnapshot.data();
      setScheduleData(scheduleData);
      setUpdatedData(scheduleData);
    };
    fetchSchedule();
  }, [scheduleId]);

  const handleEdit = () => {
    setIsEditable(true);
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

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'schedule', scheduleId));
      alert('Schedule successfully deleted!');
      navigation.navigate('mainSched');
    } catch (error) {
      console.log('Error deleting schedule:', error);
    }
  };

  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
  };
 
  return (
    <>
      <View style={{ position: "absolute", height: "100%", width: "100%", justifyContent: "flex-start", alignItems: "center", zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.85)" }}>
        <View style={{ position: "absolute", width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", top: 30, paddingHorizontal: 20, zIndex: 10 }}>
          <TouchableOpacity onPress={() => { navigation.navigate('mainSched'); }}>
            <Ionicons name="arrow-back" style={{ fontSize: 40, color: "rgb(179, 229, 94)" }} />
          </TouchableOpacity>
          {!isEditable ? (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={handleEdit}>
                <Ionicons name="pencil" style={{ fontSize: 25, color: "rgb(179, 229, 94)", marginRight: 10 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash" style={{ fontSize: 25, color: "rgb(179, 229, 94)" }} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleUpdate}>
              <Ionicons name="checkmark" style={{ fontSize: 35, color: "rgb(179, 229, 94)"}} />
            </TouchableOpacity>
          )}
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
                      style={[styles.fieldValue, focusedField === 'title' && styles.focusedField]}
                      value={updatedData.title}
                      editable={isEditable}
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
                      style={[styles.fieldValue, focusedField === 'description' && styles.focusedField]}
                      value={updatedData.description}
                      editable={isEditable}
                      multiline={true}
                      onFocus={() => handleFieldFocus('description')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, description: text })}
                    />
                  </View>
                )}
                {scheduleData.location && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Location</Text>
                    <TextInput
                      style={[styles.fieldValue, focusedField === 'location' && styles.focusedField]}
                      value={updatedData.location}
                      editable={isEditable}
                      onFocus={() => handleFieldFocus('location')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, location: text })}
                    />
                  </View>
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
                {scheduleData.startTime && (
                  <View style={styles.fieldContainer}>
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
                )}
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
                {scheduleData.assignCollector && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldName}>Assigned Collector</Text>
                    <TextInput
                      style={[styles.fieldValue, focusedField === 'assignCollector' && styles.focusedField]}
                      value={updatedData.assignCollector}
                      editable={isEditable}
                      onFocus={() => handleFieldFocus('assignCollector')}
                      onBlur={handleFieldBlur}
                      onChangeText={(text) => setUpdatedData({ ...updatedData, assignCollector: text })}
                    />
                  </View>
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
    flexDirection: 'column', // Set flexDirection to 'column'
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
    paddingLeft:10, paddingRight: 10, 
    fontSize: 16,
    marginTop: 5, 
    width: 310,
    height: 35,
  },
  focusedField: {
    borderColor: 'rgba(17, 152, 18, 1)',
    borderWidth: 1,
  },
});