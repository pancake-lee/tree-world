# UserApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**userDelUserDeptAssoc**](#userdeluserdeptassoc) | **DELETE** /user-dept-assoc | |
|[**userEditUserName**](#usereditusername) | **PATCH** /user | |
|[**userLogin**](#userlogin) | **POST** /user/token | |

# **userDelUserDeptAssoc**
> object userDelUserDeptAssoc()

从部门中移除用户

### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let userID: number; // (optional) (default to undefined)
let deptID: number; // (optional) (default to undefined)

const { status, data } = await apiInstance.userDelUserDeptAssoc(
    userID,
    deptID
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userID** | [**number**] |  | (optional) defaults to undefined|
| **deptID** | [**number**] |  | (optional) defaults to undefined|


### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **userEditUserName**
> object userEditUserName(apiEditUserNameRequest)

修改用户名

### Example

```typescript
import {
    UserApi,
    Configuration,
    ApiEditUserNameRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let apiEditUserNameRequest: ApiEditUserNameRequest; //

const { status, data } = await apiInstance.userEditUserName(
    apiEditUserNameRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiEditUserNameRequest** | **ApiEditUserNameRequest**|  | |


### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **userLogin**
> ApiLoginResponse userLogin(apiLoginRequest)

登录或注册，其实可以理解为只是通过用户账号密码新建一个token，用于其他接口鉴权

### Example

```typescript
import {
    UserApi,
    Configuration,
    ApiLoginRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let apiLoginRequest: ApiLoginRequest; //

const { status, data } = await apiInstance.userLogin(
    apiLoginRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiLoginRequest** | **ApiLoginRequest**|  | |


### Return type

**ApiLoginResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

