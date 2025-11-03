import { observer } from 'mobx-react-lite';
import { Text, View } from 'react-native';

import { AuthButton, AuthViewModel } from '@/features/auth';

import { withContainer } from '@/shared/di-react-native';
import { useViewModel } from '@/shared/reactive-state';

import { AuthContainer } from './AuthContainer';

const AuthScreen = observer(() => {
  const authViewModel = useViewModel(AuthViewModel);

  return (
    <View>
      <Text>{authViewModel.state.authStatus === 'authorized' ? 'Authorized' : 'Unauthorized'}</Text>
      <AuthButton />
    </View>
  );
});

export default withContainer(AuthContainer)(AuthScreen);
