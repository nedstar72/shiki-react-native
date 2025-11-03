import { Text, TouchableHighlight } from 'react-native';

import { useViewModel } from '@/shared/reactive-state';

import { AuthViewModel } from '../../viewModels';

export function AuthButton() {
  const authViewModel = useViewModel(AuthViewModel);

  const onPress = async () => {
    authViewModel.dispatch('login');
  };

  return (
    <TouchableHighlight onPress={onPress}>
      <Text>AuthButton</Text>
    </TouchableHighlight>
  );
}
