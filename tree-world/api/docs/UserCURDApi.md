# UserCURDApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**userCURDAddUser**](#usercurdadduser) | **POST** /user | |
|[**userCURDAddUserDept**](#usercurdadduserdept) | **POST** /user-dept | |
|[**userCURDAddUserDeptAssoc**](#usercurdadduserdeptassoc) | **POST** /user-dept-assoc | |
|[**userCURDAddUserJob**](#usercurdadduserjob) | **POST** /user-job | |
|[**userCURDDelUserByIDList**](#usercurddeluserbyidlist) | **DELETE** /user | |
|[**userCURDDelUserDeptByIDList**](#usercurddeluserdeptbyidlist) | **DELETE** /user-dept | |
|[**userCURDDelUserJobByIDList**](#usercurddeluserjobbyidlist) | **DELETE** /user-job | |
|[**userCURDGetUserDeptAssocList**](#usercurdgetuserdeptassoclist) | **GET** /user-dept-assoc | |
|[**userCURDGetUserDeptList**](#usercurdgetuserdeptlist) | **GET** /user-dept | |
|[**userCURDGetUserJobList**](#usercurdgetuserjoblist) | **GET** /user-job | |
|[**userCURDGetUserList**](#usercurdgetuserlist) | **GET** /user | |

# **userCURDAddUser**
> ApiAddUserResponse userCURDAddUser(apiAddUserRequest)

--------------------------------------------------  tbl : user

### Example

```typescript
import {
    UserCURDApi,
    Configuration,
    ApiAddUserRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let apiAddUserRequest: ApiAddUserRequest; //

const { status, data } = await apiInstance.userCURDAddUser(
    apiAddUserRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiAddUserRequest** | **ApiAddUserRequest**|  | |


### Return type

**ApiAddUserResponse**

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

# **userCURDAddUserDept**
> ApiAddUserDeptResponse userCURDAddUserDept(apiAddUserDeptRequest)

--------------------------------------------------  tbl : user_dept

### Example

```typescript
import {
    UserCURDApi,
    Configuration,
    ApiAddUserDeptRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let apiAddUserDeptRequest: ApiAddUserDeptRequest; //

const { status, data } = await apiInstance.userCURDAddUserDept(
    apiAddUserDeptRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiAddUserDeptRequest** | **ApiAddUserDeptRequest**|  | |


### Return type

**ApiAddUserDeptResponse**

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

# **userCURDAddUserDeptAssoc**
> ApiAddUserDeptAssocResponse userCURDAddUserDeptAssoc(apiAddUserDeptAssocRequest)

--------------------------------------------------  tbl : user_dept_assoc

### Example

```typescript
import {
    UserCURDApi,
    Configuration,
    ApiAddUserDeptAssocRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let apiAddUserDeptAssocRequest: ApiAddUserDeptAssocRequest; //

const { status, data } = await apiInstance.userCURDAddUserDeptAssoc(
    apiAddUserDeptAssocRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiAddUserDeptAssocRequest** | **ApiAddUserDeptAssocRequest**|  | |


### Return type

**ApiAddUserDeptAssocResponse**

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

# **userCURDAddUserJob**
> ApiAddUserJobResponse userCURDAddUserJob(apiAddUserJobRequest)

--------------------------------------------------  tbl : user_job

### Example

```typescript
import {
    UserCURDApi,
    Configuration,
    ApiAddUserJobRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let apiAddUserJobRequest: ApiAddUserJobRequest; //

const { status, data } = await apiInstance.userCURDAddUserJob(
    apiAddUserJobRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiAddUserJobRequest** | **ApiAddUserJobRequest**|  | |


### Return type

**ApiAddUserJobResponse**

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

# **userCURDDelUserByIDList**
> object userCURDDelUserByIDList()


### Example

```typescript
import {
    UserCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.userCURDDelUserByIDList(
    iDList
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iDList** | **Array&lt;number&gt;** |  | (optional) defaults to undefined|


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

# **userCURDDelUserDeptByIDList**
> object userCURDDelUserDeptByIDList()


### Example

```typescript
import {
    UserCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.userCURDDelUserDeptByIDList(
    iDList
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iDList** | **Array&lt;number&gt;** |  | (optional) defaults to undefined|


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

# **userCURDDelUserJobByIDList**
> object userCURDDelUserJobByIDList()


### Example

```typescript
import {
    UserCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.userCURDDelUserJobByIDList(
    iDList
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iDList** | **Array&lt;number&gt;** |  | (optional) defaults to undefined|


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

# **userCURDGetUserDeptAssocList**
> ApiGetUserDeptAssocListResponse userCURDGetUserDeptAssocList()


### Example

```typescript
import {
    UserCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

const { status, data } = await apiInstance.userCURDGetUserDeptAssocList();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**ApiGetUserDeptAssocListResponse**

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

# **userCURDGetUserDeptList**
> ApiGetUserDeptListResponse userCURDGetUserDeptList()


### Example

```typescript
import {
    UserCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.userCURDGetUserDeptList(
    iDList
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iDList** | **Array&lt;number&gt;** |  | (optional) defaults to undefined|


### Return type

**ApiGetUserDeptListResponse**

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

# **userCURDGetUserJobList**
> ApiGetUserJobListResponse userCURDGetUserJobList()


### Example

```typescript
import {
    UserCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.userCURDGetUserJobList(
    iDList
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iDList** | **Array&lt;number&gt;** |  | (optional) defaults to undefined|


### Return type

**ApiGetUserJobListResponse**

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

# **userCURDGetUserList**
> ApiGetUserListResponse userCURDGetUserList()


### Example

```typescript
import {
    UserCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.userCURDGetUserList(
    iDList
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iDList** | **Array&lt;number&gt;** |  | (optional) defaults to undefined|


### Return type

**ApiGetUserListResponse**

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

