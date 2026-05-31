class AliasAwareLabelEncoder:
    def __init__(self, encoder, aliases=None):
        self.encoder = encoder
        self.aliases = dict(aliases or {})
        self.classes_ = getattr(encoder, "classes_", None)

    def transform(self, values):
        normalized_values = [self.aliases.get(value, value) for value in values]
        try:
            return self.encoder.transform(normalized_values)
        except Exception:
            classes = getattr(self.encoder, "classes_", None)
            fallback = len(classes) // 2 if classes is not None and len(classes) else 0
            return [fallback for _ in normalized_values]

    def inverse_transform(self, values):
        return self.encoder.inverse_transform(values)

    def __getattr__(self, name):
        encoder = self.__dict__.get("encoder")
        if encoder is None:
            raise AttributeError(name)
        return getattr(encoder, name)