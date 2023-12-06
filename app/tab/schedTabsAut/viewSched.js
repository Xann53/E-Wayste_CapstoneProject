import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../../../firebase_config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import DatePicker from 'react-native-datepicker';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function ViewSchedDetails({ navigation, route }) {
  const { scheduleId } = route.params;
  const [scheduleData, setScheduleData] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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
    if (fieldName === 'type') {
      setShowDropdown(true);
    } else if (fieldName === 'startTime' && isEditable) {
      showTimePicker();
    } else if (fieldName === 'selectedDate' && isEditable) {
      showDatePicker();
    } else {
      setShowDropdown(false);
    }
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
    setShowDropdown(false);
  };

  const resetEdit = () => {
    setIsEditable(false);
    setUpdatedData(scheduleData);
  };

  const showTimePicker = () => {
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisible(false);
  };

  const handleTimeConfirm = (time) => {
    const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format time without milliseconds
    setSelectedTime(formattedTime);
    hideTimePicker();
    setUpdatedData({ ...updatedData, startTime: formattedTime });
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    setSelectedDate(formattedDate);
    hideDatePicker();
    setUpdatedData({ ...updatedData, selectedDate: formattedDate });
  };
  

  return (
    <>
      <View style={{ position: "absolute", height: "100%", width: "100%", justifyContent: "flex-start", alignItems: "center", zIndex: 10, backgroundColor: "rgba(0, 0, 0, 0.85)" }}>
        <View style={{ position: "absolute", width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", top: 30, paddingHorizontal: 20, zIndex: 10 }}>
          <TouchableOpacity onPress={() => { resetEdit(); navigation.navigate('mainSched'); }}>
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
                    {isEditable ? (
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={updatedData.type}
                          onValueChange={(value) => setUpdatedData({ ...updatedData, type: value })}
                          style={styles.picker}
                          enabled={isEditable}
                        >
                          <Picker.Item label="Collection" value="Collection" />
                          <Picker.Item label="Event" value="Event" />
                          <Picker.Item label="Assignment" value="Assignment" />
                        </Picker>
                      </View>
                    ) : (
                      <Text style={styles.fieldValue}>{updatedData.type}</Text>
                    )}
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
                    {isEditable ? (
                      <TouchableOpacity
                        style={[styles.fieldValue, focusedField === 'selectedDate' && styles.focusedField]}
                        onPress={showDatePicker}
                      >
                        <Text>{(selectedDate || updatedData.selectedDate) && (selectedDate || updatedData.selectedDate)}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.fieldValue}>{selectedDate || updatedData.selectedDate}</Text>
                    )}
                  </View>
                )}
                {scheduleData.startTime && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldName}>Time</Text>
                  {isEditable ? (
                    <TouchableOpacity
                    style={[styles.fieldValue, focusedField === 'startTime' && styles.focusedField]}
                    onPress={() => handleFieldFocus('startTime')}
                  >
                    <Text>{selectedTime || updatedData.startTime}</Text>
                  </TouchableOpacity>
                  ) : (
                    <Text style={styles.fieldValue}>{updatedData.startTime}</Text>
                  )}
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
      {isTimePickerVisible && (
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
        />
      )}
    {isDatePickerVisible && (
        <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
      />
      )}  
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
    justifyContent: 'center',
  },
  focusedField: {
    borderColor: 'rgba(17, 152, 18, 1)',
    borderWidth: 1,
  },
  pickerContainer: {
    backgroundColor: 'rgb(231,247,233)',
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgb(215,233,217)',
    marginTop: 5,
    width: 310,
    height: 35,
    justifyContent: 'center',
  },
  picker: {
    height: 35,
    width: 310,
  },
});
