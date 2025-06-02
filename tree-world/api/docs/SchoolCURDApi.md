# SchoolCURDApi

All URIs are relative to *http://127.0.0.1:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**schoolCURDAddCourseSwapRequest**](#schoolcurdaddcourseswaprequest) | **POST** /course-swap-request | |
|[**schoolCURDDelCourseSwapRequestByIDList**](#schoolcurddelcourseswaprequestbyidlist) | **DELETE** /course-swap-request | |
|[**schoolCURDGetCourseSwapRequestList**](#schoolcurdgetcourseswaprequestlist) | **GET** /course-swap-request | |
|[**schoolCURDUpdateCourseSwapRequest**](#schoolcurdupdatecourseswaprequest) | **PATCH** /course-swap-request | |

# **schoolCURDAddCourseSwapRequest**
> ApiAddCourseSwapRequestResponse schoolCURDAddCourseSwapRequest(apiAddCourseSwapRequestRequest)

--------------------------------------------------  tbl : course_swap_request

### Example

```typescript
import {
    SchoolCURDApi,
    Configuration,
    ApiAddCourseSwapRequestRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolCURDApi(configuration);

let apiAddCourseSwapRequestRequest: ApiAddCourseSwapRequestRequest; //

const { status, data } = await apiInstance.schoolCURDAddCourseSwapRequest(
    apiAddCourseSwapRequestRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiAddCourseSwapRequestRequest** | **ApiAddCourseSwapRequestRequest**|  | |


### Return type

**ApiAddCourseSwapRequestResponse**

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

# **schoolCURDDelCourseSwapRequestByIDList**
> object schoolCURDDelCourseSwapRequestByIDList()


### Example

```typescript
import {
    SchoolCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.schoolCURDDelCourseSwapRequestByIDList(
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

# **schoolCURDGetCourseSwapRequestList**
> ApiGetCourseSwapRequestListResponse schoolCURDGetCourseSwapRequestList()


### Example

```typescript
import {
    SchoolCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.schoolCURDGetCourseSwapRequestList(
    iDList
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iDList** | **Array&lt;number&gt;** |  | (optional) defaults to undefined|


### Return type

**ApiGetCourseSwapRequestListResponse**

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

# **schoolCURDUpdateCourseSwapRequest**
> ApiUpdateCourseSwapRequestResponse schoolCURDUpdateCourseSwapRequest(apiUpdateCourseSwapRequestRequest)


### Example

```typescript
import {
    SchoolCURDApi,
    Configuration,
    ApiUpdateCourseSwapRequestRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SchoolCURDApi(configuration);

let apiUpdateCourseSwapRequestRequest: ApiUpdateCourseSwapRequestRequest; //

const { status, data } = await apiInstance.schoolCURDUpdateCourseSwapRequest(
    apiUpdateCourseSwapRequestRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiUpdateCourseSwapRequestRequest** | **ApiUpdateCourseSwapRequestRequest**|  | |


### Return type

**ApiUpdateCourseSwapRequestResponse**

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

