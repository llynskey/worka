import React, { useState } from 'react';
import { Button, TextInput, View } from 'react-native';

const JobForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <View>
      <TextInput
        placeholder="Job Title"
        onChangeText={text => setTitle(text)}
        value={title}
      />
      <TextInput
        placeholder="Job Description"
        onChangeText={text => setDescription(text)}
        value={description}
      />
      <Button title="Post Job" onPress={() => {}} />
    </View>
  );
};

export default JobForm;
