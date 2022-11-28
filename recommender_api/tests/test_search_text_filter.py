from recommender_api.search_text_filter import filter_special_chars, filter_social_security_numbers

GOOD_STRING = "Åke-Öykkäröi 30291x Ääliå"


def test_acceptable_string_is_not_filtered():
    assert filter_special_chars(GOOD_STRING) == GOOD_STRING


def test_special_characters_are_filtered():
    assert filter_special_chars("(Åke-Öykkäröi) ü\\/#{30291}x \t\tÄäliå$£©") == GOOD_STRING


def test_social_security_numbers_are_filtered():
    ssn_string = """
    Peitetehtävän osallistujat:
    060620+987c,120369-1340,
    Pena,
    091200A098B,
    999000a111-
    Lista päättyy.
    """

    assert filter_social_security_numbers(ssn_string, '*****') == """
    Peitetehtävän osallistujat:
    *****,*****,
    Pena,
    *****,
    *****
    Lista päättyy.
    """
