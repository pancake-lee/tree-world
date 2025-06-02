# TaskCURDApi

All URIs are relative to *http://127.0.0.1:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**taskCURDAddTask**](#taskcurdaddtask) | **POST** /task | |
|[**taskCURDDelTaskByIDList**](#taskcurddeltaskbyidlist) | **DELETE** /task | |
|[**taskCURDGetTaskList**](#taskcurdgettasklist) | **GET** /task | |
|[**taskCURDUpdateTask**](#taskcurdupdatetask) | **PATCH** /task | |

# **taskCURDAddTask**
> ApiAddTaskResponse taskCURDAddTask(apiAddTaskRequest)

--------------------------------------------------  tbl : task

### Example

```typescript
import {
    TaskCURDApi,
    Configuration,
    ApiAddTaskRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TaskCURDApi(configuration);

let apiAddTaskRequest: ApiAddTaskRequest; //

const { status, data } = await apiInstance.taskCURDAddTask(
    apiAddTaskRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiAddTaskRequest** | **ApiAddTaskRequest**|  | |


### Return type

**ApiAddTaskResponse**

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

# **taskCURDDelTaskByIDList**
> object taskCURDDelTaskByIDList()


### Example

```typescript
import {
    TaskCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TaskCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.taskCURDDelTaskByIDList(
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

# **taskCURDGetTaskList**
> ApiGetTaskListResponse taskCURDGetTaskList()


### Example

```typescript
import {
    TaskCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TaskCURDApi(configuration);

let iDList: Array<number>; // (optional) (default to undefined)

const { status, data } = await apiInstance.taskCURDGetTaskList(
    iDList
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iDList** | **Array&lt;number&gt;** |  | (optional) defaults to undefined|


### Return type

**ApiGetTaskListResponse**

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

# **taskCURDUpdateTask**
> ApiUpdateTaskResponse taskCURDUpdateTask(apiUpdateTaskRequest)


### Example

```typescript
import {
    TaskCURDApi,
    Configuration,
    ApiUpdateTaskRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TaskCURDApi(configuration);

let apiUpdateTaskRequest: ApiUpdateTaskRequest; //

const { status, data } = await apiInstance.taskCURDUpdateTask(
    apiUpdateTaskRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiUpdateTaskRequest** | **ApiUpdateTaskRequest**|  | |


### Return type

**ApiUpdateTaskResponse**

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

