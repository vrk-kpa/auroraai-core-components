from recommender_api.mock_session_service import mock_service_results, MOCK_SERVICE_URL


def test_mock_service_is_constant():
    # create a mock service reference and assert initial value
    ids, services = mock_service_results()
    mock_service = services[0]
    assert mock_service['service_channels'][0]['web_pages'] == [MOCK_SERVICE_URL]

    # modify a value for the local mock-service reference
    mock_service['service_channels'][0]['web_pages'] = ['foobar']

    # create a new mock service reference and assert initial value
    ids, services = mock_service_results()
    mock_service = services[0]
    assert mock_service['service_channels'][0]['web_pages'] == [MOCK_SERVICE_URL]
