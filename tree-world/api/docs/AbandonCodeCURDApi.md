# AbandonCodeCURDApi

All URIs are relative to *http://127.0.0.1:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**abandonCodeCURDAddAbandonCode**](#abandoncodecurdaddabandoncode) | **POST** /abandon-code | |
|[**abandonCodeCURDDelAbandonCodeByIdx1List**](#abandoncodecurddelabandoncodebyidx1list) | **DELETE** /abandon-code | |
|[**abandonCodeCURDGetAbandonCodeList**](#abandoncodecurdgetabandoncodelist) | **GET** /abandon-code | |
|[**abandonCodeCURDUpdateAbandonCode**](#abandoncodecurdupdateabandoncode) | **PATCH** /abandon-code | |

# **abandonCodeCURDAddAbandonCode**
> ApiAddAbandonCodeResponse abandonCodeCURDAddAbandonCode(apiAddAbandonCodeRequest)

MARK REPEAT API START 一个表的接口定义  --------------------------------------------------  tbl : abandon_code

### Example

```typescript
import {
    AbandonCodeCURDApi,
    Configuration,
    ApiAddAbandonCodeRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AbandonCodeCURDApi(configuration);

let apiAddAbandonCodeRequest: ApiAddAbandonCodeRequest; //

const { status, data } = await apiInstance.abandonCodeCURDAddAbandonCode(
    apiAddAbandonCodeRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiAddAbandonCodeRequest** | **ApiAddAbandonCodeRequest**|  | |


### Return type

**ApiAddAbandonCodeResponse**

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

# **abandonCodeCURDDelAbandonCodeByIdx1List**
> object abandonCodeCURDDelAbandonCodeByIdx1List()


### Example

```typescript
import {
    AbandonCodeCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AbandonCodeCURDApi(configuration);

let idx1List: Array<number>; //MARK REPLACE REQUEST IDX START 替换内容，索引字段 (optional) (default to undefined)

const { status, data } = await apiInstance.abandonCodeCURDDelAbandonCodeByIdx1List(
    idx1List
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idx1List** | **Array&lt;number&gt;** | MARK REPLACE REQUEST IDX START 替换内容，索引字段 | (optional) defaults to undefined|


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

# **abandonCodeCURDGetAbandonCodeList**
> ApiGetAbandonCodeListResponse abandonCodeCURDGetAbandonCodeList()


### Example

```typescript
import {
    AbandonCodeCURDApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AbandonCodeCURDApi(configuration);

let idx1List: Array<number>; //MARK REPLACE REQUEST IDX START 替换内容，索引字段 (optional) (default to undefined)

const { status, data } = await apiInstance.abandonCodeCURDGetAbandonCodeList(
    idx1List
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idx1List** | **Array&lt;number&gt;** | MARK REPLACE REQUEST IDX START 替换内容，索引字段 | (optional) defaults to undefined|


### Return type

**ApiGetAbandonCodeListResponse**

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

# **abandonCodeCURDUpdateAbandonCode**
> ApiUpdateAbandonCodeResponse abandonCodeCURDUpdateAbandonCode(apiUpdateAbandonCodeRequest)

MARK REMOVE IF NO PRIMARY KEY START

### Example

```typescript
import {
    AbandonCodeCURDApi,
    Configuration,
    ApiUpdateAbandonCodeRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AbandonCodeCURDApi(configuration);

let apiUpdateAbandonCodeRequest: ApiUpdateAbandonCodeRequest; //

const { status, data } = await apiInstance.abandonCodeCURDUpdateAbandonCode(
    apiUpdateAbandonCodeRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **apiUpdateAbandonCodeRequest** | **ApiUpdateAbandonCodeRequest**|  | |


### Return type

**ApiUpdateAbandonCodeResponse**

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

