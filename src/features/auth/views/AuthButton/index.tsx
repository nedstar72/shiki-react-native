import { Text, TouchableHighlight } from 'react-native';
import { authorize } from 'react-native-app-auth';
import Constants from 'expo-constants';

function AuthButton() {
  const onPress = async () => {
    const { accessToken, refreshToken } = await authorize({
      clientId: Constants.expoConfig?.extra?.oauth2?.clientId,
      clientSecret: Constants.expoConfig?.extra?.oauth2?.clientSecret,
      redirectUrl: 'dev.nedstar.shiki://oauth',
      scopes: ['user_rates', 'comments', 'topics'],
      serviceConfiguration: {
        authorizationEndpoint: 'https://shikimori.one/oauth/authorize',
        tokenEndpoint: 'https://shikimori.one/oauth/token',
      },
    });
    console.log({ accessToken, refreshToken });
  };

  return (
    <TouchableHighlight onPress={onPress}>
      <Text>AuthButton</Text>
    </TouchableHighlight>
  );
}

export default AuthButton;
