package plant.dev.logplant.serviec;

import plant.dev.com.cmm.exception.CustomException;
import plant.dev.com.cmm.util.map.CustomMap;

import java.util.List;

public interface LogPlantService {
    public List<CustomMap> getPlantLog() throws CustomException;
}
